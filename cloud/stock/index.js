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
  // const OPENID = cloud.getWXContext().OPENID;

  switch (event.action) {
    // case 'rank': {
    //   return rank(event)
    // }
    case 'stockbondsrenew': {
      return stockbondsrenew(event)
    }
    case 'stockbondspush': {
      return stockbondspush(event)
    }
    case 'stockbondspull': {
      return stockbondspull(event)
    }
    case 'otherStockUsers': {
      return otherStockUsers(event)
    }
    case 'otherStockAccount': {
      return otherStockAccount(event)
    }
    // case 'fundstockrankhistory': {
    //   return fundstockrankhistory(event)
    // }
  }

  //下个版本废弃
  // function rank(event) {
  //   return DB.collection('stock').aggregate()
  //   .lookup({
  //     from: 'account',
  //     localField: 'userid',
  //     foreignField: '_id',
  //     as: 'userList',
  //   })
  //   .replaceRoot({
  //     newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]), '$$ROOT' ])
  //   })
  //   .project({
  //     _id:0,
  //     userList: 0,
  //     _openid: 0,
  //     join_date: 0,
  //     last_signin_time: 0,
  //     has_stock_account: 0,
  //     peanut: 0,
  //     xiaocai: 0,
  //     wine_1573: 0,
  //     wine_jnc: 0,
  //     stock_deal_records: 0,
  //     stock_focus: 0,
  //     create_date: 0,
  //     reward_from_otheruser: 0
  //   })
  //   .sort({
  //     contribution:-1
  //   })
  //   .end();
  // }

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

  //下个版本废弃
  // function fundstockrankhistory (event) {
  //   return DB.collection('qkfund').where({
  //     _id:'79550af26034a656069f61a01a8c5b3d',
  //     }).field({
  //       stock_rank:true,
  //       stock_rank_history:true,
  //     }).get();
  // }


}