//app.js
App({
  onLaunch: function () {
    // 云开发环境初始化
    wx.cloud.init({
      env:"henrydb-8g7n4zhd43011797"
    })
    // 展示本地存储能力
    // var logs = wx.getStorageSync('logs') || []
    // logs.unshift(Date.now())
    // wx.setStorageSync('logs', logs)

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
                this.fundInfoReadyCbToIndex(res)
              }
              if (this.fundInfoReadyCbToUserInfoComponent) {
                this.fundInfoReadyCbToUserInfoComponent(res)
              }
              if(this.globalData.hasUserInfo&&res.result.data[0].avatarUrl!=this.globalData.userInfo.avatarUrl){
                this.renewAvatarUrl();
              }
            }else if(res.result.data.length==0){
              if(this.globalData.hasUserInfo){
                this.createNewUser();
              }else{
                this.globalData.canCreateNewFundUser = true;
              }
              if (this.fundInfoReadyCbToUserInfoComponent) {
                this.fundInfoReadyCbToUserInfoComponent(res)
              }
            }else{
              console.log('访问基金会云端失败');
            }
          }
        })
        //云函数请求结束
      }
    })

    // 获取用户信息
    // wx.getSetting({
    //   success: res => {
    //     console.log(res);
    //     if (res.authSetting['scope.userInfo']) {
    //     }
    //   }
    // })
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          // wx.getUserInfo即将废弃，改用wx.getUserProfile

          // wx.getUserInfo({
          //   success: res => {
          //     console.log(res);
          //     // 可以将 res 发送给后台解码出 unionId
          //     this.globalData.userInfo = res.userInfo;
          //     this.globalData.hasUserInfo = true;
          //     if(this.globalData.gotFundInfo&&res.userInfo.avatarUrl!=this.globalData.fundUserInfo.avatarUrl){
          //       this.renewAvatarUrl();
          //     }
          //     // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
          //     // 所以此处加入 callback 以防止这种情况
          //     if (this.userInfoReadyCallback) {
          //       this.userInfoReadyCallback(res)
          //     }
          //   }
          // })
  },
  //onLaunch结束

    //通过云函数获取基金会账户信息
    getFundUserInfo:function(){
      console.log('appjs调用getfunduserinfo');
      wx.cloud.callFunction({
        name:'login',
        complete:res=>{
          if(res.result.data.length>0){
            this.globalData.userId = res.result.data[0]._id;
            this.globalData.fundUserInfo = res.result.data[0];
            this.globalData.gotFundInfo = true;
            this.globalData.canCreateNewFundUser = false;
            if (this.fundInfoReadyCbToIndex) {
              this.fundInfoReadyCbToIndex(res)
            }
            if (this.fundInfoReadyCbToUserInfoComponent) {
              this.fundInfoReadyCbToUserInfoComponent(res)
            }
            if(this.globalData.userInfo&&res.result.data[0].avatarUrl!=this.globalData.userInfo.avatarUrl){
              this.renewAvatarUrl();
            }
          }else{
            console.log('无法查询到基金会账户信息');
          }
        }
      })
    },

    //获取用户昵称头像用于创建基金会账户或者更新头像
    getWeChatUserInfo:function(){
      wx.getUserProfile({
        desc:'用以创建小程序账户或者更新头像',
        success:res=>{
          console.log(res);
          this.globalData.userInfo = res.userInfo;
          this.globalData.hasUserInfo = true;
          if(this.globalData.canCreateNewFundUser){
            this.createNewUser();
            console.log('启动创建基金会用户信息');
          }else if(this.globalData.gotFundInfo&&this.globalData.fundUserInfo.avatarUrl!=this.globalData.userInfo.avatarUrl){
            this.renewAvatarUrl();
            console.log('启动更新用户头像');
          }else{
            wx.showToast({
              title: '头像不需要更新',
              icon:'error',
              duration:2000
            })
            console.log('获取用户信息成功');
          }
        },
        fail:res=>{
          console.log('获取用户信息失败');
          console.log(res);
        }
      })
    },

    //如果基金会数据库没有用户信息就自动创建
    createNewUser:function(){
      console.log('appjs调用createNewUser');
      const DB = wx.cloud.database().collection("account");
      DB.add({
        data:{
          name:this.globalData.userInfo.nickName,
          avatarUrl:this.globalData.userInfo.avatarUrl,
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
        success:res=>{
          console.log("添加用户数据成功",res._id)
          this.globalData.canCreateNewFundUser = false;
          wx.showToast({
            title: '创建账户成功',
            icon:'success',
            duration:2000
          })
          this.getFundUserInfo();
        },
        fail:res=>{
          this.globalData.canCreateNewFundUser = true;
          wx.showToast({
            title: '创建账户失败',
            icon:'error',
            duration:2000
          })
          console.log("添加用户数据失败",res)
        }
      })
    },

    //更新新的用户头像到基金会云端
    renewAvatarUrl:function(){
      const DB = wx.cloud.database().collection("account");
      DB.doc(this.globalData.userId).update({
        data:{
          avatarUrl:this.globalData.userInfo.avatarUrl
        },
        success:res=>{
          if(res.stats.updated>0){
            wx.showToast({
              title: '更新头像成功',
              icon:'success',
              duration:2000
            })
            this.getFundUserInfo();
            console.log("更新用户头像成功");
          }else{
            wx.showToast({
              title: '更新头像失败',
              icon:'error',
              duration:2000
            })
            console.log("更新用户头像失败");
          }
        },
        fail:res=>{
          console.log(res);
          console.log("访问云数据库失败");
        }
      })
    },

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
  }
})