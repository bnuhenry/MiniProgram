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
  // console.log(context);
  // const OPENID = cloud.getWXContext().OPENID;

  switch (event.action) {
    case 'otherFundUsers': {
      return otherFundUsers(event)
    }
    case 'fundSlogan': {
      return fundSlogan(event)
    }
    case 'fundSchedule': {
      return fundSchedule(event)
    }
    case 'updatefundslogan': {
      return updatefundslogan(event)
    }
    case 'getAllFundName':{
      return getAllFundName()
    }
    case 'getFundJoinUserInfo':{
      return getFundJoinUserInfo(event)
    }
    case 'acceptUserJoinFund':{
      return acceptUserJoinFund(event)
    }
    case 'pullUserFromFundApplication':{
      return pullUserFromFundApplication(event)
    }
    case 'joinFundApplication':{
      return joinFundApplication(event)
    }
    case 'removeFundUser':{
      return removeFundUser(event)
    }
  }

  //查找属于此基金会的日程共享信息
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

  //查询基金会其他成员信息
  function otherFundUsers(event) {
    return DB.collection("account").where({
      fund:_.eq(event.fund),
      _id:_.neq(event.userId)
    }).field({
      avatarUrl:true,
      name:true,
      _id:true,
      rank:true,
      contribution:true
    }).orderBy('contribution','desc').get();
  }

  //通过基金会代码查询到基金会口号及创作者信息
  function fundSlogan(event) {
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
      newRoot: $.mergeObjects([ $.arrayElemAt(['$userList', 0]),'$slogan', '$$ROOT' ])
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
      reward_from_otheruser: 0,
      slogan:0,
      userList:0,
      join_application:0,
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
            time:Date.now()
          }
        }
      })
  }

  //查询所有基金会名字
  function getAllFundName() {
    return DB.collection('qkfund')
    .field({
      _id:false,
      slogan:false,
    }).get();
  }

  //查询单个基金会信息包括入会申请用户id
  function getFundJoinApplication(event){
    return DB.collection('qkfund').where({
      fund:event.fund
    })
    .field({
      _id:false,
      slogan:false
    }).limit(1).get();
  }

  //聚合查询入会申请用户资料
  function getFundJoinUserInfo(event){
    return DB.collection('qkfund').aggregate()
    .match({
      fund:event.fund
    })
    .lookup({
      from: 'account',
      localField: 'join_application',
      foreignField: '_id',
      as: 'userList',
    })
    .project({
      'userList.name': 1,
      'userList.avatarUrl': 1,
      'userList.contribution': 1,
      'userList.fund': 1,
      'userList._id': 1,
    })
    .end()
  }

  //将用户id加入到基金会申请加入数组中
  function pushToFundApplication(event){
    return DB.collection('qkfund').where({
      fund:event.fund
    }).update({
      data:{
        join_application:_.push(event.userId)
      }
    })
  }

  //加入基金会递交申请
  function joinFundApplication(event){
    return new Promise((resolve,reject)=>{
      getFundJoinApplication(event).then(res=>{
        if(res.data.length > 0){
          const joinUserAry = res.data[0].join_application;
          if(joinUserAry.includes(event.userId)){
            reject('已经提交过申请');
          }else{
            resolve(pushToFundApplication(event));
          }
        }else{
          reject('查询不到基金会信息');
        }
      })
    })
  }

  //将用户id从基金会申请数组中删除
  function pullUserFromFundApplication(event){
    return DB.collection('qkfund').where({
      fund:event.fund
    }).update({
      data:{
        join_application:_.pull(event.userId)
      }
    })
  }

  //变更用户基金会代码
  function changeUserFund(event){
    return DB.collection('account').where({
      _id:event.userId
    }).update({
      data:{
        fund:event.fund
      }
    })
  }

  //查询单个用户目前基金会所属情况
  function checkUserFund(event) {
    return DB.collection("account").where({
      _id:event.userId
    }).field({
      fund:true
    }).limit(1).get();
  }

  //批准用户加入基金会入口
  function acceptUserJoinFund(event){
    return new Promise((resolve,reject)=>{
      checkUserFund(event).then(res=>{
        if(res.data.length > 0){
          if(res.data[0].fund == 'other'){
            resolve(changeUserFund(event));
            pullUserFromFundApplication(event);
          }else{
            reject('用户已经加入基金会');
          }
        }else{
          reject('查询不到基金会信息');
        }
      })
    })
  }

  //开除基金会成员，改变用户字段为other
  function removeFundUser(event) {
    return DB.collection("account").where({
      fund:event.fund,
      _id:event.userId
    }).update({
      data:{
        fund:'other'
      }
    })
  }

}