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
  let { APPID, UNIONID } = cloud.getWXContext()
  console.log(event);
  console.log(context);
  const OPENID = cloud.getWXContext().OPENID;

  switch (event.action) {
    case 'fundSchedule': {
      return fundSchedule(event)
    }
    case 'otherFundUsers': {
      return otherFundUsers(event)
    }
    case 'contriToOtherFundUser': {
      return contriToOtherFundUser(event)
    }
    case 'fundslogan': {
      return fundslogan(event)
    }
    case 'updatefundslogan': {
      return updatefundslogan(event)
    }
    default: {
      return DB.collection("account").where({
        _openid:OPENID
      }).get();
    }
  }

  function fundSchedule(event) {
    return DB.collection('schedule').aggregate()
    .match({
      fund:event.fund
    })
    .lookup({
      from: 'account',
      localField: 'createrId',
      foreignField: '_id',
      as: 'userList',
    })
    .replaceRoot({
      newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]), '$$ROOT' ])
    })
    .project({
      userList: 0,
      _openid: 0,
      join_date: 0,
      last_signin_time: 0,
      has_stock_account: 0,
      peanut: 0,
      xiaocai: 0,
      wine_1573: 0,
      wine_jnc: 0,
      rank: 0,
      contribution: 0,
      reward_from_otheruser: 0
    })
    .end()
  }

  function otherFundUsers(event) {
    return DB.collection("account").where({
      fund:event.fund,
      _id:_.neq(event.userId)
    }).field({
      avatarUrl:true,
      name:true,
      _id:true,
      rank:true,
      contribution:true
    }).orderBy('contribution','desc').get();
  }

  function contriToOtherFundUser(event) {
    return DB.collection('account').where({
      _id:event.userId
      }).update({
        data: {
          peanut:_.inc(event.peanut),
          xiaocai:_.inc(event.xiaocai),
          wine_jnc:_.inc(event.wine_jnc),
          reward_from_otheruser:_.unshift({
            peanut:event.peanut,
            xiaocai:event.xiaocai,
            wine_jnc:event.wine_jnc,
            from_userid:event.fromuserId,
            from_system:false,
            system_remarks:'个人赠送',
            time:Date.now()
          })
        }
      })
  }

  //在以后的版本根据数据库基金会划分而选择加入基金会名字参数
  function fundslogan(event) {
    return DB.collection('qkfund').aggregate()
    .match({
      fund:event.fund
    })
    .lookup({
      from: 'account',
      localField: 'slogan.creator',
      foreignField: '_id',
      as: 'userList',
    })
    .replaceRoot({
      // newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]), '$$ROOT' ])
      //并入同一数组请用下面这句代码
      newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]), '$slogan' ])
    })
    .project({
      _openid: 0,
      join_date: 0,
      last_signin_time: 0,
      has_stock_account: 0,
      peanut: 0,
      xiaocai: 0,
      wine_1573: 0,
      wine_jnc: 0,
      rank: 0,
      contribution: 0,
      _id:0,
      reward_from_otheruser: 0
    })
    .end()
  }

  //已加入基金会名字参数event.fund
  function updatefundslogan(event) {
    return DB.collection('qkfund').where({
      fund:event.fund,
      }).update({
        data: {
          slogan:{
            words:event.words,
            creator:event.creator,
            time:event.time
          }
        }
      })
  }

}