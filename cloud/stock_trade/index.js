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
  const OPENID = cloud.getWXContext().OPENID;

  return new Promise((resolve, reject) => {
    checkStockAccount(event).then(res=>{
      const bondsAry = res.data[0].stock_bonds;
      const cash = res.data[0].cash;
      const clientBondsAry = event.stock_bonds_ary;
      let bondsAryNoChange = true;
      if(bondsAry.length == clientBondsAry.length){
        for(let i = 0;i<bondsAry.length;i++){
          if((bondsAry[i].id != clientBondsAry[i].id)||(bondsAry[i].bonds != clientBondsAry[i].bonds)){
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

  //查询股票账户信息
  function checkStockAccount(event){
    return DB.collection('stock').where({
      userid:event.userId,
      _openid:OPENID
    })
    .limit(1)
    .get()
  }

  //模拟盘账户下所有持仓股票全部卖出(一键清仓)
  function stockbondsallclear(event){
    return DB.collection('stock').where({
      userid:event.userId,
      _openid:OPENID
    })
    .update({
      data: {
        stock_bonds: _.set([]),
        cash:_.inc(event.makeMoney),
        stock_deal_records:_.push(event.dealRecordsAry)
      }
    })
  }

  //买卖已持有股票(加减仓)
  function stockbondsrenew(event){
    const buy = event.bonds>0?true:false;
    return DB.collection('stock').where({
      userid:event.userId,
      _openid:OPENID,
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

  //买入新的持仓股票(建仓)
  function stockbondspush(event){
    return DB.collection('stock').where({
      userid:event.userId,
      _openid:OPENID,
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

  //卖出某只股票的全部持仓(个股清仓)
  function stockbondspull(event){
    return DB.collection('stock').where({
      userid:event.userId,
    }).update({
      data: {
        stock_bonds: _.pull({
          id:event.stockRequestId,
        }),
        cash:_.inc(event.makeMoney),
        stock_deal_records:_.push({
          amount: event.bonds,
          buy:false,
          price:event.price,
          id:event.stockRequestId,
          time:Date.now()
        })
      }
    })
  }
  

}

