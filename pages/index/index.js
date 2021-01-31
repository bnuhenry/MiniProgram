//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: '欢迎',
    userInfo: {},
    serveInfo: {},
    userName:'',
    hasUserInfo: false,
    fundUserId:0,
    dickLength:0,
    showDickLength:'',
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canServeUse: false,
    canDig:true,
    peaNut:0,
    xiaoCai:0,
    jianNanChun:0,
    oneFiveSevenThree:0,
    miningResult:'',
    contributionResult:''
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        console.log(res.userInfo)
        this.setData({
          userInfo: res.userInfo,
          userName: res.userInfo.nickName,
          hasUserInfo: true
        })
        this.getFundUserInfo();
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  //获取基金会用户信息，如果没有就注册一个
  getFundUserInfo:function(){
    wx.request({
      url: 'http://119.29.170.42/api/qkfund/login.php',
      method:"POST",
      data:{
        username:this.data.userInfo.nickName,
        avatarurl:this.data.userInfo.avatarUrl
      },
      success: res => {
        console.log(res.data)
        this.setData({
          fundUserId:res.data.id,
          peaNut:res.data.peanut,
          xiaoCai:res.data.xiaocai,
          jianNanChun:res.data.wine_jnc,
        })
      },
      fail:res=>{
        console.log('获取基金会服务器信息失败')
      }
    })  
  },

  getUserLength: function() {
    const username = this.data.userName
    this.setData({
      dickLength : Math.random()*100
    })
    switch(username){
      case('溜溜的榴芒'):{
        this.setData({
          dickLength:this.data.dickLength-50
        })
        break;
      }
      case('天'):{
        this.setData({
          dickLength:this.data.dickLength+50
        })
        break;
      }
    }
    this.returndickLength();
  },

  returndickLength:function(){
    const length = Math.floor(this.data.dickLength / 5)
    const lengthStr = length + 'CM'
    this.setData({
      showDickLength: lengthStr
    })
  },

  //点击挖矿
  getMining:function(){
    this.setData({
      canDig:false
    })
    const lucky = Math.floor(Math.random()*100)
    if(lucky%5==0){
      this.updateToSql(1)
    }else if(lucky%11==0&&lucky<35){
      this.updateToSql(2)
    }else if(lucky==66){
      this.updateToSql(3)
    }else{
      this.setData({
        miningResult:'什么鬼都没挖到'
      })
    }
    setTimeout(()=>{
      this.setData({
        canDig:true
      })
    },2000)
  },

  //模拟本地挖矿数据增加，已废弃
  reWardGift:function(key){
    switch(key){
      case(1):{
        let num = this.data.peaNut;
        num++;
        this.setData({peaNut:num});
        break;
      }
      case(2):{
        let num = this.data.xiaoCai;
        num++;
        this.setData({xiaoCai:num});
        break;
      }
      case(3):{
        let num = this.data.jianNanChun;
        num++;
        this.setData({jianNanChun:num});
        break;
      }
    }
  },

  updateToSql:function(category){
    wx.request({
      url: 'http://119.29.170.42/api/qkfund/update.php',
      method:"POST",
      data:{
        id:this.data.fundUserId,
        category:category
      },
      success: res => {
        console.log(res.data)
        this.setData({
          miningResult:'挖到东西了！'
        })
        switch(category){
          case(1):{
            this.setData({peaNut:res.data.num});
            this.showToastMsg('获得一颗花生');
            break;
          }
          case(2):{
            this.setData({xiaoCai:res.data.num});
            this.showToastMsg('获得一盘小菜');
            break;
          }
          case(3):{
            this.setData({jianNanChun:res.data.num});
            this.showToastMsg('获得一瓶贱男春');
            break;
          }
        }
      },
      fail:res=>{
        console.log('获取基金会服务器信息失败')
      }
    })  
  },

  showToastMsg(title){
    wx.showToast({
      title: title,
      icon: 'success',
      duration: 1000
    })
  },

  // 获取用户信息
  getUserId:function(){
    wx.getSetting({
      success: res => {
        console.log(res);
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              console.log(res);
            }
          })
      }
    })
  },

  //挖到的东西捐赠给基金会获取声望
  getContribution:function(){
    this.setData({
      contributionResult:''
    });
    const that = this;
    wx.showModal({
      title: 'All In！',
      content: '确定全部捐给基金会换取声望吗？',
      success (res) {
        if (res.confirm) {
          that.setData({
            contributionResult:'已经全部捐出'
          });
          console.log('全部捐出！');
        } else if (res.cancel) {
          console.log('我再想想')
        }
      }
    })
    console.log('已全部捐出');
  }
 
})
