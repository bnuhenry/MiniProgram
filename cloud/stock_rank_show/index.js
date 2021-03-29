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
    case 'stockrank': {
      return stockrank(event)
    }
    case 'stockrankhistory': {
      return stockrankhistory(event)
    }
    case 'stockRankUserFund': {
      return stockRankUserFund(event)
    }
  }

  //查询所有已开通模拟盘用户账户持仓
  function stockrank(event) {
    return DB.collection('stock').aggregate()
    .lookup({
      from: 'account',
      localField: 'userid',
      foreignField: '_id',
      as: 'userList',
    })
    .replaceRoot({
      newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]), '$$ROOT' ])
    })
    .project({
      _id:0,
      userList: 0,
      _openid: 0,
      join_date: 0,
      last_signin_time: 0,
      has_stock_account: 0,
      peanut: 0,
      xiaocai: 0,
      wine_1573: 0,
      wine_jnc: 0,
      stock_deal_records: 0,
      stock_focus: 0,
      create_date: 0,
      reward_from_otheruser: 0
    })
    .sort({
      contribution:-1
    })
    .end();
  }

  //查询模拟盘排名记录
  function stockrankhistory (event) {
    return DB.collection('stock_rank_history').where({
      time:_.gte(event.start_time),
      }).field({
        _id:false,
      }).orderBy('time','desc').get();
  }

  //查询所有已开通模拟盘用户所在的基金会名字
  function stockRankUserFund(event) {
    return DB.collection('qkfund').where({
      fund:_.in(event.fundAry)
    })
    .field({
      _id:false,
      slogan:false,
      join_application:false
    }).get();
  }


}