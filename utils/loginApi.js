const app = getApp()

function getFundUserInfo(){
  console.log('api调用获取基金会账户信息云函数');
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name:'login',
      complete:res=>{
        if(res.result.data.length>0){
          app.globalData.userId = res.result.data[0]._id;
          app.globalData.fundUserInfo = res.result.data[0];
          app.globalData.gotFundInfo = true;
          app.globalData.canCreateNewFundUser = false;
          resolve(res.result.data);
        }else if(res.result.data.length==0){
          app.globalData.canCreateNewFundUser = true;
          resolve(res.result.data);
        }else{
          reject('无法查询到基金会账户信息');
        }
      }
    })
  })
}

//获取云端基金会方针政策信息
function getFundSlogan(){
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name:'fund',
      data: {
        action: 'fundSlogan',
        fund:app.globalData.fundUserInfo.fund
      },
      complete:res=>{
        if(res.result.list.length>0){
          app.globalData.fundSloganInfo = res.result.list[0];
          resolve(res.result.list[0])
        }else{
          reject('获取基金会方针政策信息失败');
        }
      }
    })
  })
}

function getWeChatUserInfo(){
  return new Promise((resolve,reject)=>{
    wx.getUserProfile({
      desc:'用以创建小程序账户或者更新头像',
      success:res=>{
        console.log(res);
        app.globalData.userInfo = res.userInfo;
        app.globalData.hasUserInfo = true;
        if(app.globalData.canCreateNewFundUser){
          resolve(createNewUser());
          console.log('启动创建基金会用户信息');
        }else if(app.globalData.gotFundInfo&&app.globalData.fundUserInfo.avatarUrl!=app.globalData.userInfo.avatarUrl){
          resolve(renewAvatarUrl());
          console.log('启动更新用户头像');
        }else{
          wx.showToast({
            title: '头像不需要更新',
            icon:'error',
            duration:2000
          })
          resolve('头像不需要更新');
          console.log('获取用户信息成功');
        }
      },
      fail:res=>{
        reject('获取用户信息失败');
        console.log('获取用户信息失败');
        console.log(res);
      }
    })
  })
}

//如果基金会数据库没有用户信息就自动创建
function createNewUser(){
  console.log('api调用创建基金会账户云函数');
  return new Promise((resolve,reject)=>{
    if(app.globalData.hasUserInfo){
      const userName = app.globalData.userInfo.nickName;
      const userAvatar = app.globalData.userInfo.avatarUrl;
      wx.cloud.callFunction({
        name:'account',
        data:{
          action:'createNewFundUser',
          name:userName,
          avatarUrl:userAvatar,
        },
        success:res=>{
          wx.showToast({
            title: '创建账户成功',
            icon:'success',
            duration:2000
          })
          resolve(getFundUserInfo());
        },
        fail:res=>{
          console.log(res);
          wx.showToast({
            title: '创建账户失败',
            icon:'error',
            duration:2000
          })
          resolve(getFundUserInfo());
        }
      })
    }else{
      wx.showToast({
        title: '未获取微信授权',
        icon:'error',
        duration:2000
      })
      reject('未获取微信授权');
    }
  })
}

//更新新的用户头像到基金会云端
function renewAvatarUrl(){
  const DB = wx.cloud.database().collection("account");
   return DB.doc(app.globalData.userId).update({
    data:{
      avatarUrl:app.globalData.userInfo.avatarUrl
    }
  })
}

module.exports.getFundUserInfo = getFundUserInfo;
module.exports.getFundSlogan = getFundSlogan;
module.exports.createFundUser = getWeChatUserInfo;
module.exports.editAvatar = getWeChatUserInfo;