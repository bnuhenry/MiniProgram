const app = getApp()
const getFundRankInfo = require("../../utils/fundRank.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    fundUserInfo:{},
    userName:'',
    fundName:'',
    newUserName:'',
    userAvatar:'',
    userId:'',
    reNewUserName:false,
    showEidtNameInput:false,
    showEditFundPolicyInput:false,
    changeNameMsg:'',
    changeFundPolicyMsg:'',
    changeNameLoading:false,
    changeFundPolicyLoading:false,
    newFundPolicy:'',
    recentFundPolicy:String,
    isMemberOfQKfund:false,
    contribution:0,
    recentRankName:'',
    nextRankName:'',
    contriUntilNextRank:0,
    contriNeedNextRank:0,
    rateBarStyle:'',
    hasStockAccount:false,
    canStockAccountUpgrade:false,
    canUpgradeCapital:0,
    accountCash:0,
    accountCapital:0,
    stockDealReordsAry:[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
  },

  onShow:function(){
    if (app.globalData.gotFundInfo) {
      this.setData({
        userId: app.globalData.userId,
        userName: app.globalData.fundUserInfo.name,
        newUserName: app.globalData.fundUserInfo.name,
        userAvatar:app.globalData.fundUserInfo.avatarUrl,
        fundUserInfo:app.globalData.fundUserInfo,
        contribution:app.globalData.fundUserInfo.contribution,
        hasStockAccount:app.globalData.fundUserInfo.has_stock_account,
        isMemberOfFund:app.globalData.fundUserInfo.fund != 'other',
        recentFundPolicy:app.globalData.fundSloganInfo.words,
        fundName:app.globalData.fundSloganInfo.fund_name,
      })
      this.makeRankName(app.globalData.fundUserInfo.contribution);
      this.getStockAccountInfo();
    }
  },

  //修改名字输入框绑定
  bindNameInput:function(e){
    this.setData({
      newUserName: e.detail.value
    })
  },

  //基金会方针政策输入框绑定
  bindPolicyInput:function(e){
    this.setData({
      newFundPolicy: e.detail.value
    })
  },

  //点击修改名字
  editUserName:function(){
    this.setData({
      showEditFundPolicyInput:false,
      showEidtNameInput:!this.data.showEidtNameInput
    })
  },

  //点击基金会方针政策
  editFundPolicy:function(){
    this.setData({
      showEidtNameInput:false,
      showEditFundPolicyInput:!this.data.showEditFundPolicyInput
    })
  },

  //输入框点击取消按钮
  cancelEdit:function(){
    this.setData({
      showEidtNameInput:false,
      showEditFundPolicyInput:false
    })
  },

  //点击确定修改
  changeUserName:function(){
    const nameLength = this.data.newUserName.length;
    if(nameLength==0){
      this.setData({
        changeNameMsg:'不要留白，填点什么'
      })
    }else if(nameLength>=12){
      this.setData({
        changeNameMsg:'太长了，没法搞'
      })
    }else if(this.data.userName == this.data.newUserName){
      this.setData({
        changeNameMsg:'跟原名字一样，没有修改过'
      })
    }else{
      wx.showModal({
        title: '修改名字',
        content: '确定使用’'+this.data.newUserName+'’作为新名字吗？',
        success:res=> {
          if (res.confirm) {
            console.log('修改名字启动');
            this.setData({
              changeNameMsg:'修改中...',
              userName:this.data.newUserName,
              changeNameLoading:true
            })
          this.upDateNewName();
          } else if (res.cancel) {
            this.setData({
              changeNameMsg:'让我冷静一下'
            })
          }
        }
      })
    }
  },

  //更新用户云端数据库名字
  upDateNewName:function(){
    wx.showLoading({
      title: '修改中',
    })
    const DB = wx.cloud.database();
    DB.collection("account").doc(app.globalData.userId).update({
      data:{
        name:this.data.newUserName
      },
      success:res=>{
        wx.hideLoading();
        if(res.stats.updated>0){
          this.setData({
            changeNameMsg:'修改完成',
            changeNameLoading:false
          })
          app.getFundUserInfo();
        }else{
          this.setData({
            changeNameMsg:'修改失败',
            changeNameLoading:false
          })
        }
      },
      fail:res=>{
        console.log("更新云数据失败")
        wx.hideLoading();
        this.setData({
          changeNameMsg:'更新数据库失败',
          changeNameLoading:false
        })
      }
    })
  },

  //点击喊出口号按钮
  changeFundPolicy:function(){
    if(this.data.newFundPolicy==this.data.recentFundPolicy){
      this.setData({
        changeFundPolicyMsg:'跟原来的口号一样，来点实际的'
      })
    }else if(this.data.newFundPolicy.length==0){
      this.setData({
        changeFundPolicyMsg:'真的是空谈？'
      })
    }else{
      wx.showModal({
        title: '修改方针政策',
        content: '确定喊出’'+this.data.newFundPolicy+'’这种空谈误国的口号吗？',
        success:res=> {
          if (res.confirm) {
            console.log('修改口号启动');
            this.setData({
              changeFundPolicyMsg:'正在蓄力喊出口号...',
              changeFundPolicyLoading:true,
            })
            this.updateNewFundPolicy();
          } else if (res.cancel) {
            this.setData({
              changeFundPolicyMsg:'让我冷静一下...'
            })
          }
        }
      })
    }
  },

  //更新新的口号以及修改用户信息到云端
  updateNewFundPolicy:function(){
    setTimeout(()=>{
      this.setData({
        changeFundPolicyLoading:false,
      })
    },5000)
    if(app.globalData.gotFundInfo&&app.globalData.fundUserInfo.fund!="other"){
      wx.showLoading({
        title: '修改中',
      })
      wx.cloud.callFunction({
        name:'login',
        data: {
          action: 'updatefundslogan',
          creator:app.globalData.userId,
          words:this.data.newFundPolicy,
          fund:app.globalData.fundUserInfo.fund,
          time:Date.now()
        },
        complete:res=>{
          wx.hideLoading();
          if(res.result.stats.updated>0){
            this.setData({
              changeFundPolicyMsg:'口号喊出来了...',
              recentFundPolicy:this.data.newFundPolicy,
            })
          }else{
            this.setData({
              changeFundPolicyMsg:'口号没喊出来，很尴尬...',
            })
            console.log('喊出口号失败，没喊出来');
          }
        }
      })
    }else{
      this.setData({
        changeFundPolicyMsg:'你没有权限制定方针政策',
      })
    }
  },

  //查询股票账户信息
  getStockAccountInfo:function(){
    wx.showLoading({
      title: '加载中',
    })
    const DB = wx.cloud.database();
    DB.collection('stock').where({
      userid:this.data.userId
    }).limit(1).get({
      success:res=>{
        if(res.data.length>0){
          this.setData({
            accountCash:res.data[0].cash,
            accountCapital:res.data[0].capital,
          })
          this.checkCanStockAccountUpgrade(res.data[0].capital);
        }else{
          console.log("查询不到模拟盘用户信息");
        }
        wx.hideLoading();
      },
      fail:res=>{
        console.log("获取云数据失败");
        wx.hideLoading();
      },
    })
  },

  //云端变更股票账户资本金与现金
  updateStockAccountCapitalNCash:function(){
    wx.showLoading({
      title: '加载中',
    })
    const DB = wx.cloud.database();
    const _ = DB.command;
    DB.collection('stock').where({
      userid:this.data.userId
    }).update({
      data:{
        cash:_.inc(this.data.canUpgradeCapital-this.data.accountCapital),
        capital:this.data.canUpgradeCapital
      },
      success:res=>{
        if(res.stats.updated>0){
          console.log("升级模拟盘账户成功!");
          wx.showToast({
            title: '升级成功',
            icon: 'success',
            duration: 2000
          })
          app.getFundUserInfo();
          this.getStockAccountInfo();
        }else{
          console.log("升级模拟盘账户失败");
        }
        wx.hideLoading();
      },
      fail:res=>{
        console.log("获取云数据失败");
        wx.hideLoading();
      },
    })
  },

  //升级模拟盘账户
  upgradeStockAccount:function(){
    const canUpgradeCapital = this.data.canUpgradeCapital;
    let modalContent = '';
    switch(canUpgradeCapital){
      case(10000000):{
        modalContent = '一千万';
        break;
      }
      case(50000000):{
        modalContent = '五千万';
        break;
      }
      case(100000000):{
        modalContent = '一个亿';
        break;
      }
    }
    if(canUpgradeCapital>0){
      wx.showModal({
        title: '升级模拟盘账户',
        content: '确定升级至'+modalContent+'资本金的模拟盘账户？',
        success:res=> {
          if (res.confirm) {
            this.updateStockAccountCapitalNCash();
            console.log('正在升级至'+canUpgradeCapital+'资本金模拟盘账户');
          } else if (res.cancel) {
            console.log('我再想想')
          }
        }
      })
    }
  },

  //查询股票账户是否可以升级
  checkCanStockAccountUpgrade:function(capital){
    if(capital<1000000||capital>100000000){
      console.log('资本金数额有误');
    }else{
      const contribution = this.data.contribution;
      if(contribution>=10000){
        this.setData({
          canUpgradeCapital:100000000,
          canStockAccountUpgrade:capital<100000000
        })
      }else if(contribution>=5000){
        this.setData({
          canUpgradeCapital:50000000,
          canStockAccountUpgrade:capital<50000000
        })
      }else if(contribution>=2500){
        this.setData({
          canUpgradeCapital:10000000,
          canStockAccountUpgrade:capital<10000000
        })
      }else{
        this.setData({
          canStockAccountUpgrade:false
        })
      }
    }
  },

  //通过捐赠值获取基金会位阶
  makeRankName:function(contribution){
    const rankInfoObj = getFundRankInfo.getFundRankInfo(contribution);
    this.setData({
      recentRankName:rankInfoObj.rankName,
      nextRankName:rankInfoObj.nextRankName,
      contriUntilNextRank:rankInfoObj.nextRankRequireContri-contribution,
      contriNeedNextRank:rankInfoObj.nextRankRequireContri,
    })
    this.getContriRateBarStyle(Math.floor((contribution-(rankInfoObj.nextRankRequireContri-rankInfoObj.nextRankLevelNeed))*100/rankInfoObj.nextRankLevelNeed));
  },

  //根据传入数值获取进度条样式
  getContriRateBarStyle:function(width){
    this.setData({
      rateBarStyle:'width:'+width+'%;'
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },
})