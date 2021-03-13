// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env:"henrydb-8g7n4zhd43011797"
})

const DB = cloud.database();
const _ = DB.command;
const $ = DB.command.aggregate;

// 云函数入口函数
exports.main = async (event, context) => {
  // 这里获取到的 openId、 appId 和 unionId 是可信的，注意 unionId 仅在满足 unionId 获取条件时返回
  // let { APPID, UNIONID } = cloud.getWXContext()
  // console.log(event);
  const OPENID = cloud.getWXContext().OPENID;

  switch (event.action) {
    //下个版本从case语句中删除，入口改为stockBondsTrade
    case 'stockbondsrenew': {
      return stockbondsrenew(event)
    }
    //下个版本从case语句中删除，入口改为stockBondsTrade
    case 'stockbondspush': {
      return stockbondspush(event)
    }
    //下个版本从case语句中删除，入口改为stockBondsTrade
    case 'stockbondspull': {
      return stockbondspull(event)
    }
    case 'otherStockUsers': {
      return otherStockUsers(event)
    }
    case 'otherStockAccount': {
      return otherStockAccount(event)
    }
    //下个版本从case语句中删除，入口改为stockBondsTrade
    case 'stockbondsallclear': {
      return stockbondsallclear(event)
    }
    case 'stockBondsTrade': {
      return stockBondsTrade(event)
    }
  }

  function otherStockUsers(event) {
    return DB.collection("account").where({
      has_stock_account:true,
      _id:_.neq(event.userId)
    }).field({
      avatarUrl:true,
      name:true,
      _id:true,
      rank:true,
      contribution:true
    }).orderBy('contribution','desc').get();
  }

  function otherStockAccount(event) {
    return DB.collection('stock').where({
      userid:event.userId
    }).limit(1).get()
  }

  function stockbondsrenew(event){
    const buy = event.bonds>0?true:false;
    return DB.collection('stock').where({
      'userid':event.userId,
      'stock_bonds.id': event.stockRequestId
      }).update({
        data: {
          'stock_bonds.$.bonds': _.inc(event.bonds),
          cash:_.inc(event.makeMoney),
          stock_deal_records:_.push({
            amount:event.bonds,
            buy:buy,
            price:event.price,
            id:event.stockRequestId,
            time:Date.now()
          })
        }
      })
  }

  function stockbondspush(event){
    return DB.collection('stock').where({
      'userid':event.userId,
      }).update({
        data: {
          stock_bonds: _.push({
            id:event.stockRequestId,
            bonds:event.bonds
          }),
          cash:_.inc(event.makeMoney),
          stock_deal_records:_.push({
            amount:event.bonds,
            buy:true,
            price:event.price,
            id:event.stockRequestId,
            time:Date.now()
          })
        }
      })
  }

  function stockbondspull(event){
    return DB.collection('stock').where({
      'userid':event.userId,
      }).update({
        data: {
          stock_bonds: _.pull({
            id:event.stockRequestId,
          }),
          cash:_.inc(event.makeMoney),
          stock_deal_records:_.push({
            amount: - event.bonds,
            buy:false,
            price:event.price,
            id:event.stockRequestId,
            time:Date.now()
          })
        }
      })
  }

  function stockbondsallclear(event){
    return DB.collection('stock').where({
      'userid':event.userId,
      })
      .update({
        data: {
          stock_bonds: _.set([]),
          cash:_.inc(event.makeMoney),
          stock_deal_records:_.push(event.dealRecordsAry)
        }
      })
  }

  //新版本上线查询股票账户信息方法
  function checkStockAccount(event,OPENID){
    return DB.collection('stock').where({
      userid:event.userId,
      _openid:OPENID
    })
    .limit(1)
    .get()
  }

  //新版本上线的股票交易云函数
  function stockBondsTrade(event){
    return new Promise((resolve, reject) => {
      checkStockAccount(event,OPENID).then(res=>{
        const bondsAry = res.data[0].stock_bonds;
        const cash = res.data[0].cash;
        const clientBondsAry = event.stock_bonds_ary;
        let bondsAryNoChange = true;
        if(bondsAry.length == clientBondsAry.length){
          for(let i = 0;i<bondsAry.length;i++){
            if((bondsAry[i].id == clientBondsAry[i].id)&&(bondsAry[i].bonds == clientBondsAry[i].bonds)){
              break;
            }else{
              bondsAryNoChange = false;
            }
          }
        }else{
          bondsAryNoChange = false;
        }
        if(bondsAryNoChange){
          if(event.dealType == 1){
            if(cash+event.makeMoney>=0){
              let stockIndex = -1;
              for(let i = 0;i<bondsAry.length;i++){
                if(event.stockRequestId == bondsAry[i].id){
                  stockIndex = i;
                  break;
                }
              }
              if(stockIndex >= 0){
                resolve(stockbondsrenew(event));
              }else{
                resolve(stockbondspush(event));
              }
            }else{
              reject('现金不够')
            }
          }else if(event.dealType == 2){
            const bonds = Math.abs(event.bonds);
            let stockIndex = -1;
            for(let i = 0;i<bondsAry.length;i++){
              if(event.stockRequestId == bondsAry[i].id){
                stockIndex = i;
                break;
              }
            }
            if(stockIndex>=0){
              if(bonds < bondsAry[stockIndex].bonds){
                resolve(stockbondsrenew(event));
              }else if(bonds == bondsAry[stockIndex].bonds){
                resolve(stockbondspull(event));
              }else{
                reject('卖出数量有误，成交失败');
              }
            }
          }else if(event.dealType == 3){
            resolve(stockbondsallclear(event));
          }else{
            reject('交易类型错误');
          }
        }else{
          reject('交易数据错误');
        }
      })
    })
    

  }

}