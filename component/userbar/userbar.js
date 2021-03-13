const app = getApp()
const getFundRankInfo = require("../../utils/fundRank.js")

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    fundUserInfo:{
      type:Object
    },
    userName:{
      type:String
    },
    recentRankName:{
      type:String
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    fundUserInfo:{},
    userName:'',
    userId:'',
    userAvatar:'',
    hasFundUserInfo:false,
    canCreateNewFundUser:false,
    rankTitle:'',
    rankTitleDiscrb:''
  },

  lifetimes: {
    attached: function() {
      if (app.globalData.gotFundInfo) {
        console.log('got info from app');
        this.setData({
          userId: app.globalData.userId,
          fundUserInfo: app.globalData.fundUserInfo,
          hasFundUserInfo:true,
          canCreateNewFundUser:app.globalData.canCreateNewFundUser
        })
        this.getRankTitle(this.data.fundUserInfo.contribution);
      }else{
        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        // 所以此处加入 callback 以防止这种情况
        console.log('got info from call back');
        app.fundInfoReadyCbToUserInfoComponent = res => {
          if(res.result.data.length>0){
            this.setData({
              userId: res.result.data[0]._id,
              fundUserInfo: res.result.data[0],
              hasFundUserInfo:true,
              canCreateNewFundUser:false
            })
            this.getRankTitle(res.result.data[0].contribution);
          }else if(res.result.data.length==0){
            this.setData({
              canCreateNewFundUser:true
            })
          }
        }
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //获取微信用户头像创建基金会账户
    createNewFundUser:function(){
      wx.showModal({
        title: '创建账户',
        content: '是否创建小程序账户？需要获取微信昵称以及头像',
        success:res=> {
          if (res.confirm) {
            app.getWeChatUserInfo();
            console.log('正在创建账户');
            this.setData({
              canCreateNewFundUser:false
            })
          } else if (res.cancel) {
            console.log('不用了谢谢')
          }
        }
      })
    },

    //获取微信用户昵称头像
    renewFundUserAvatar: function(){
      wx.showModal({
        title: '更新头像',
        content: '是否替换当前微信头像至小程序头像？需要获取微信昵称以及头像信息',
        success:res=> {
          if (res.confirm) {
            app.getWeChatUserInfo();
            console.log('正在更新用户头像');
          } else if (res.cancel) {
            console.log('不用了谢谢')
          }
        }
      })
    },

    //通过捐赠值获取基金会位阶
    getRankTitle:function(contribution){
      const rankInfoObj = getFundRankInfo.getFundRankInfo(contribution);
      this.setData({
        rankTitle : rankInfoObj.rankName,
        rankTitleDiscrb:rankInfoObj.rankTitleDiscrb
      })
    }
  }
})
