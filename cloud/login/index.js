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
  const OPENID = cloud.getWXContext().OPENID;

  switch (event.action) {
    case 'login': {
      return login()
    }
    //下个版本改为account云函数运行************************************
    case 'rewardUsers': {
      return rewardUsers(event)
    }
    //下个版本改为account云函数运行************************************
    case 'signUp': {
      return signUp(event)
    }
    //下个版本改为account云函数运行************************************
    case 'contribution': {
      return contribution(event)
    }
    //下个版本改为account云函数运行************************************
    case 'createNewFundUser':{
      return createNewFundUser(event)
    }
    // 下个版本即将改为stock云函数进入*******************************
    case 'upgradeStockAccount':{
      return upgradeStockAccount(event)
    }
    default: {
      return login()
    }
  }

  //登录基金会账户函数
  function login(){
    return DB.collection("account").where({
      _openid:OPENID
    }).field({
      _openid:false
    }).get();
  }

  //查询物资捐赠方用户信息,下个版本改为account云函数运行************************************
  function rewardUsers(event){
    return DB.collection("account").where({
      _id:_.in(event.userIdAry)
    }).field({
      avatarUrl:true,
      name:true,
      _id:true,
    }).get();
  }

  //捐赠物资给个人后更新被捐赠对象数据库,下个版本改为account云函数运行************************************
  function contriToOtherUser(event) {
    return DB.collection('account').where({
      _id:event.toUserId
      }).update({
        data: {
          peanut:_.inc(event.peanut),
          xiaocai:_.inc(event.xiaocai),
          wine_jnc:_.inc(event.wine_jnc),
          reward_from_otheruser:_.unshift({
            peanut:event.peanut,
            xiaocai:event.xiaocai,
            wine_jnc:event.wine_jnc,
            from_userid:event.fromUserId,
            from_system:false,
            system_remarks:'个人赠送',
            time:Date.now()
          })
        }
      })
  }

  //捐赠者扣除物资，根据捐赠类型决定是提高声望还是更新他人物资,下个版本改为account云函数运行************************************
  function renewUserResource(event) {
    const peanutscore = 1;
    const xiaocaiscore = 3;
    const wine_jncscore = 5;
    let totalContribution = 0;
    if(event.contriType == 1){
      totalContribution = event.peanut*peanutscore + event.xiaocai*xiaocaiscore + event.wine_jnc*wine_jncscore;
    }
    return DB.collection('account').where({
      _id:event.userId,
      _openid:OPENID
      }).update({
        data: {
          peanut:_.inc(-event.peanut),
          xiaocai:_.inc(-event.xiaocai),
          wine_jnc:_.inc(-event.wine_jnc),
          contribution:_.inc(totalContribution)
        }
      })
  }

  //更新签到信息,下个版本改为account云函数运行************************************
  function updateSignInfo(event) {
    return DB.collection('account').where({
      _id:event.userId,
      _openid:OPENID
      }).update({
        data: {
          peanut:_.inc(event.peanut),
          xiaocai:_.inc(event.xiaocai),
          wine_jnc:_.inc(event.wine_jnc),
          last_signin_time:Date.now()
        }
      })
  }

  //获取用户签到时间以及资源,下个版本改为account云函数运行************************************
  function getUserSignTimeAndResource(event){
    return DB.collection("account").where({
      _id:event.userId,
      _openid:OPENID
    }).field({
      last_signin_time:true,
      peanut:true,
      xiaocai:true,
      wine_jnc:true
    }).limit(1).get();
  }

  //聚合查询两个集合用户股票账户本金以及基金会声望，即将改为stock云函数进入*******************************
  function getStockCapitalAndContribution(event){
    return DB.collection('stock').aggregate()
    .match({
      userid:event.userId
    })
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
      contribution:1,
      capital:1,
    })
    .limit(1)
    .end()
  }

  //升级模拟盘判断条件选择更新的本金多少以及加入多少现金，需要云函数应对双开客户端前后请求，即将改为stock云函数进入*******************************
  function updateStockAccountCaptital(event,capital,contribution){
    let canRewardCapital = 0;
    if(contribution>=10000){
      canRewardCapital = Math.floor(100000000 - capital);
    }else if(contribution>=5000){
      canRewardCapital = Math.floor(50000000 - capital);
    }else if(contribution>=2500){
      canRewardCapital = Math.floor(10000000 - capital);
    }
    if(canRewardCapital>0){
      return DB.collection('stock').where({
          userid:event.userId
        }).update({
          data:{
            cash:_.inc(canRewardCapital),
            capital:_.inc(canRewardCapital)
          },
        })
    }else{
      return new Promise((resolve,reject)=>{
        reject('条件未达到，无法升级模拟盘账户')
      })
    }
  }

  //签到所用的云函数，由客户端负责随机生成数字，共有三种不同资源,下个版本改为account云函数运行************************************
  function signUp(event){
    return new Promise((resolve, reject) => {
      getUserSignTimeAndResource(event).then(res=>{
        if(event.lastSignUpTime == res.data[0].last_signin_time){
          resolve(updateSignInfo(event));
        }else{
          reject('数据已过期');
        }
      })
    })
  }

  //升级模拟盘账户所用的云函数,首先判断客户端传递参数是否和数据库的一致，即将改为stock云函数进入*******************************
  function upgradeStockAccount(event){
    return new Promise((resolve, reject) => {
      getStockCapitalAndContribution(event).then(res=>{
        if(event.capital == res.list[0].capital){
          resolve(updateStockAccountCaptital(event,res.list[0].capital,res.list[0].contribution));
        }else{
          reject('数据已过期');
        }
      })
    })
  }

  //新增account集合记录,下个版本改为account云函数运行************************************
  function addNewFundAccount(event){
    return DB.collection("account").add({
      data:{
        _openid:OPENID,
        name:event.name,
        avatarUrl:event.avatarUrl,
        peanut:0,
        xiaocai:0,
        wine_jnc:0,
        wine_1573:0,
        contribution:0,
        rank:0,
        fund:'other',
        last_signin_time:0,
        has_stock_account:false,
        reward_from_otheruser:[],
        join_date:Date.now()
      },
    })
  }

  //捐赠物资所用的入口云函数,下个版本改为account云函数运行************************************
  function contribution(event){
    return new Promise((resolve, reject) => {
      getUserSignTimeAndResource(event).then(res=>{
        if((event.peanut_max == res.data[0].peanut)&&(event.xiaocai_max == res.data[0].xiaocai)&&(event.wine_jnc_max == res.data[0].wine_jnc)){
          if(event.contriType == 1){
            resolve(renewUserResource(event));
          }else if(event.contriType == 2){
            renewUserResource(event).then(res=>{
              resolve(contriToOtherUser(event));
              console.log(res);
              console.log(res.stats.updated);
            })
          }else{
            reject('捐赠类型错误');
          }
        }else{
          reject('数据已过期');
        }
      })
    })
  }

  //创建基金会用户入口,下个版本改为account云函数运行************************************
  function createNewFundUser(event){
    return new Promise((resolve,reject)=>{
      login().then(res=>{
        if(res.data.length == 0){
          resolve(addNewFundAccount(event));
        }else if(res.data.length > 0){
          reject('您已有基金会账户');
        }
      })
    })
  }

}