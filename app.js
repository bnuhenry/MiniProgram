//app.js
App({
  onLaunch: function () {
    // 云开发环境初始化
    wx.cloud.init({
      env:"henrydb-8g7n4zhd43011797"
    })

    // 登录
    wx.login({
      success: res => {
        //云函数请求
        wx.cloud.callFunction({
          name:'login',
          complete:res=>{
            if(res.result.data.length>0){
              this.globalData.userId = res.result.data[0]._id;
              this.globalData.fundUserInfo = res.result.data[0];
              this.globalData.gotFundInfo = true;
              console.log('拿到基金会账户信息');
              if (this.fundInfoReadyCbToIndex) {
                this.fundInfoReadyCbToIndex(res.result.data)
              }
            }else if(res.result.data.length==0){
              this.globalData.canCreateNewFundUser = true;
              if (this.fundInfoReadyCbToIndex) {
                this.fundInfoReadyCbToIndex(res.result.data)
              }
            }else{
              console.log('访问基金会云端失败');
            }
          }
        })
        //云函数请求结束
      }
    })
  },
  //onLaunch结束

  //更新小程序版本
  updateMiniProgramVersion:function(){
    const updateManager = wx.getUpdateManager();
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '版本已更新，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    updateManager.onUpdateFailed(function () {
      // 新版本下载失败
      console.log('新版本下载失败');
    })
  },
    
 
  globalData: {
    userInfo: null,
    userId:null,
    fundUserInfo:{},
    hasUserInfo:false,
    gotFundInfo:false,
    fundSloganInfo:{},
    canCreateNewFundUser:false,
    needRecheckStockAccount:false,
  }
})