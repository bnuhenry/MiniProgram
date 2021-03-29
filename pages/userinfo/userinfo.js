const app = getApp()
const getFundRankInfo = require("../../utils/fundRank.js")
const fundUserApi = require("../../utils/loginApi.js")

Page({
  // 页面的初始数据
  data: {
    showEidtInputer:false,
    isMemberOfFund:false,
    isNoFundUser:false,
    isManagerOfFund:false,
    isMemberOfFundCouncil:false,
    contribution:-1,
    accountCapital:0,
    hasStockAccount:false,
    canStockAccountUpgrade:false,
    upgradeButtonDisable:false,
    canJoinFundAry:[],
    wantToJoinFundName:'请选择',
    wantToJoinFund:'',
    showJoinUserPicker:false,
  },


  // 生命周期函数--监听页面加载
  onLoad: function () {
  },

  onShow:function(){
    this.callUserBarComponentMethod();
    if (app.globalData.gotFundInfo) {
      this.setData({
        userId: app.globalData.userId,
        userName: app.globalData.fundUserInfo.name,
        fundUserInfo:app.globalData.fundUserInfo,
        hasStockAccount:app.globalData.fundUserInfo.has_stock_account,
        isMemberOfFund:app.globalData.fundUserInfo.fund != 'other',
        isNoFundUser:app.globalData.fundUserInfo.fund == 'other',
        isManagerOfFund:app.globalData.fundUserInfo.contribution >= 2500 || app.globalData.fundUserInfo.rank >= 3,
        isMemberOfFundCouncil:app.globalData.fundUserInfo.rank >= 5,
        userFund: app.globalData.fundUserInfo.fund,
      })
      if(app.globalData.fundUserInfo.fund != 'other'){
        this.setData({
          fundName:app.globalData.fundSloganInfo.fund_name
        })
        this.data.recentFundPolicy = app.globalData.fundSloganInfo.words;
      }
      if(this.data.contribution!=app.globalData.fundUserInfo.contribution){
        this.setData({
          contribution:app.globalData.fundUserInfo.contribution
        })
        this.getStockAccountInfo();
        this.makeRankName(app.globalData.fundUserInfo.contribution);
      }
    }
    if(this.data.canStockAccountUpgrade){
      this.makeUpgradeButtonAnimation();
    }
    wx.removeTabBarBadge({
      index:3
    })
  },

  // 生命周期函数--监听页面隐藏
  onHide:function(){
    this.cancelUpgradeButtonAnimation();
  },

  //调用子组件userbar的方法更新他的数据
  callUserBarComponentMethod:function(){
    const userBar = this.selectComponent("#userinfoUserBar");
    userBar.pageTriggerRefresh();
  },

  //请求云端数据重新渲染页面
  getFundUserObjFromCallBack:function(res){
    this.setData({
      fundUserInfo:res[0],
      isMemberOfFund:app.globalData.fundUserInfo.fund != 'other',
      isNoFundUser:app.globalData.fundUserInfo.fund == 'other',
      isManagerOfFund:app.globalData.fundUserInfo.contribution >= 2500 || app.globalData.fundUserInfo.rank >= 3,
      isMemberOfFundCouncil:app.globalData.fundUserInfo.rank >= 5,
      userFund: app.globalData.fundUserInfo.fund,
    })
    this.callUserBarComponentMethod();
    if(app.globalData.fundUserInfo.fund != 'other'){
      this.setData({
        fundName:app.globalData.fundSloganInfo.fund_name
      })
      this.data.recentFundPolicy = app.globalData.fundSloganInfo.words;
    }
  },

  //点击修改名字
  editUserName:function(){
    this.setData({
      showEidtInputer:true,
      editInputerType:'name'
    })
  },

  //点击基金会方针政策
  editFundPolicy:function(){
    this.setData({
      showEidtInputer:true,
      editInputerType:'slogan'
    })
  },

  //点击申请加入基金会
  clickJoinFund:function(){
    this.setData({
      showEidtInputer:true,
      editInputerType:'joinFund'
    })
  },

  //点击查看入会申请
  checkJoinApplication:function(){
    this.setData({
      showJoinUserPicker:true,
      otherUserPickType:'join'
    })
  },  

  //点击申请加入基金会
  councilMemberJoinFund:function(){
    this.setData({
      showEidtInputer:true,
      editInputerType:'councilMemberJoinFund'
    })
  },

  //点击会内开除成员
  removeFundUser:function(){
    this.setData({
      showJoinUserPicker:true,
      otherUserPickType:'removeFundUser'
    })
  },

  //更新用户云端数据库名字
  upDateNewName:function(newName){
    wx.showLoading({
      title: '更名中',
    })
    const DB = wx.cloud.database();
    DB.collection("account").doc(app.globalData.userId).update({
      data:{
        name:newName
      },
      success:res=>{
        if(res.stats.updated>0){
          this.resultOfPromise('更名成功',true);
          fundUserApi.getFundUserInfo().then(res=>{
            this.getFundUserObjFromCallBack(res);
          });
        }else{
          this.resultOfPromise('更名失败',false);
        }
      },
      fail:res=>{
        console.log("更新云数据失败")
        this.resultOfPromise('更名失败',false);
      }
    })
  },

  //更新新的口号以及作者信息到云端
  updateNewFundPolicy:function(newSlogan){
    if(app.globalData.gotFundInfo&&app.globalData.fundUserInfo.fund!="other"){
      wx.showLoading({
        title: '喊口号中',
      })
      wx.cloud.callFunction({
        name:'fund',
        data: {
          action: 'updatefundslogan',
          creator:app.globalData.userId,
          words:newSlogan,
          fund:app.globalData.fundUserInfo.fund,
        },
        complete:res=>{
          if(res.result.stats.updated>0){
            this.resultOfPromise('喊出来了...',true);
            fundUserApi.getFundSlogan().then(res=>{
              console.log('新口号为:'+res.words);
            })
          }else{
            this.resultOfPromise('修改失败',false);
          }
        }
      })
    }else{
      this.resultOfPromise('没有权限',false);
    }
  },

  //查询股票账户信息
  getStockAccountInfo:function(){
    wx.showLoading({
      title: '加载中',
    })
    console.log('个人信息页查询股票账户信息');
    const DB = wx.cloud.database();
    DB.collection('stock').where({
      userid:this.data.userId
    }).limit(1).get({
      success:res=>{
        if(res.data.length>0){
          this.data.accountCapital = res.data[0].capital;
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
    this.setData({
      upgradeButtonDisable:true
    })
    wx.cloud.callFunction({
      name:'stock',
      data:{
        action:'upgradeStockAccount',
        userId:this.data.userId,
        capital:this.data.accountCapital,
      },
      success:res=>{
        if(res.result.stats.updated>0){
          this.resultOfPromise('升级成功',true);
          app.globalData.needRecheckStockAccount = true;
        }else{
          this.resultOfPromise('升级失败',false);
        }
        setTimeout(()=>{
          this.getStockAccountInfo();
        },2000)
      },
      fail:res=>{
        this.resultOfPromise('数据有误',false);
        setTimeout(()=>{
          this.getStockAccountInfo();
        },2000)
        console.log(res);
      }
    })
  },

  //当模拟盘可升级时按钮加入动画
  makeUpgradeButtonAnimation:function(){
    const animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'linear',
    });
    this.data.upgradeAnimationTimer = setInterval(()=>{
      animation.opacity(0.2).step()
      animation.opacity(1).step()
      this.setData({
        upgradeButtonAnimation:animation.export()
      })
    },2000)
  },

  //升级模拟盘按钮动画停止
  cancelUpgradeButtonAnimation:function(){
    clearInterval(this.data.upgradeAnimationTimer);
  },

  //升级模拟盘账户
  upgradeStockAccount:function(){
    const canUpgradeCapital = this.data.canUpgradeCapital;
    this.cancelUpgradeButtonAnimation();
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
      if(this.data.canStockAccountUpgrade){
        this.setData({
          upgradeButtonDisable:false
        })
        this.makeUpgradeButtonAnimation();
      }
    }
  },

  //通过捐赠值获取基金会位阶
  makeRankName:function(contribution){
    const rankInfoObj = getFundRankInfo.getFundRankInfo(contribution);
    const nextRankFinishPercent = ((contribution-(rankInfoObj.nextRankRequireContri-rankInfoObj.nextRankLevelNeed))*100/rankInfoObj.nextRankLevelNeed).toFixed(1);
    this.setData({
      recentRankName:rankInfoObj.rankName,
      nextRankName:rankInfoObj.nextRankName,
      contriUntilNextRank:rankInfoObj.nextRankRequireContri-contribution,
      contriNeedNextRank:rankInfoObj.nextRankRequireContri,
      rateBarStyle:'width:'+nextRankFinishPercent+'%;'
    })
  },

  //云端获取可加入基金会列表
  joinFundApplication:function(){
    wx.cloud.callFunction({
      name:'fund',
      data:{
        action:'getAllFundName'
      },
      complete:res=>{
        this.setData({
          canJoinFundAry:res.result.data
        })
      }
    })
  },

  //提交加入基金会申请到云端
  updateFundApplication:function(fundCode){
    wx.showLoading({
      title: '提交中',
    })
    wx.cloud.callFunction({
      name:'fund',
      data:{
        action:'joinFundApplication',
        userId:this.data.userId,
        fund:fundCode
      },
      success:res=>{
        if(res.result.stats.updated>0){
          this.resultOfPromise('已提交申请',true);
          this.joinFundApplication();
        }else{
          this.resultOfPromise('提交失败',false);
        }
      },
      fail:res=>{
        console.log(res);
        this.resultOfPromise('请勿重复提交',false);
      }
    })
  },

  //接受用户入会申请并且变更用户fundcode
  updateUserFund:function(userId){
    if(this.data.isManagerOfFund){
      wx.showLoading({
        title: '提交中',
      })
      wx.cloud.callFunction({
        name:'fund',
        data:{
          action:'acceptUserJoinFund',
          userId:userId,
          fund:app.globalData.fundUserInfo.fund
        },
        success:res=>{
          if(res.result.stats.updated>0){
            this.resultOfPromise('用户入会成功',true);
          }else{
            this.resultOfPromise('提交失败',false);
          }
        },
        fail:res=>{
          console.log(res);
          this.resultOfPromise('用户已有组织',false);
        }
      })
    }else{
      wx.showToast({
        title: '你不是管理员',
        icon:'error',
        duration:2000
      })
    }
  },

  //删除基金会中用户申请入会记录
  pullUserFromFundApplication:function(userId){
    if(this.data.isManagerOfFund){
      wx.showLoading({
        title: '提交中',
      })
      wx.cloud.callFunction({
        name:'fund',
        data:{
          action:'pullUserFromFundApplication',
          userId:userId,
          fund:app.globalData.fundUserInfo.fund
        },
        success:res=>{
          if(res.result.stats.updated>0){
            this.resultOfPromise('删除申请成功',true);
          }else{
            this.resultOfPromise('删除失败',false);
          }
        },
        fail:res=>{
          console.log(res);
          this.resultOfPromise('连接失败',false);
        }
      })
    }else{
      wx.showToast({
        title: '你不是管理员',
        icon:'error',
        duration:2000
      })
    }
  },

  //更新云端开除基金会成员请求
  updateRemoveFundUser:function(userObj){
    if(userObj.contribution<2500&&userObj.rank<5){
      wx.cloud.callFunction({
        name:'fund',
        data:{
          action:'removeFundUser',
          userId:userObj._id,
          fund:app.globalData.fundUserInfo.fund
        },
        success:res=>{
          if(res.result.stats.updated>0){
            this.resultOfPromise('开除成功',true);
          }else{
            this.resultOfPromise('开除失败',false);
          }
        },
        fail:res=>{
          console.log(res);
          this.resultOfPromise('连接失败',false);
        }
      })
    }else{
      this.resultOfPromise('无法开除',false);
    }
  },

  //监督委员会直接更新基金会字段
  updateMemberOfCouncilFund:function(fundCode){
    if(this.data.isMemberOfFundCouncil){
      wx.showLoading({
        title: '提交中',
      })
      const DB = wx.cloud.database();
      DB.collection("account").where({
        _id:app.globalData.userId
      }).update({
        data:{
          fund:fundCode
        },
        success:res=>{
          if(res.stats.updated>0){
            this.resultOfPromise('进入成功',true);
            fundUserApi.getFundUserInfo().then(fundres=>{
              fundUserApi.getFundSlogan().then(res=>{
                this.getFundUserObjFromCallBack(fundres);
                console.log('新公会是:'+res.fund_name);
              })
            });
          }else{
            this.resultOfPromise('进入失败',false);
          }
        },
        fail:res=>{
          console.log(res);
          this.resultOfPromise('连接失败',false);
        }
      });
    }else{
      wx.showToast({
        title: '你没有权限',
        icon:'error',
        duration:2000
      })
    }
  },

  //视图层异步请求返回后执行结果
  resultOfPromise:function(title,isSuccess){
    const icon = isSuccess?'success':'error';
    wx.hideLoading({
      complete:res => {
        wx.showToast({
          title: title,
          icon:icon,
          duration:2000
        })
      },
    })
  },

  //接收编辑输入框组件回传新的用户名字并提交云端
  getChangeUserName:function(e){
    this.setData({
      showEidtInputer:false
    })
    this.upDateNewName(e.detail);
  },

  //接收编辑输入框组件回传新的基金会口号并提交云端
  getChangeFundSlogan:function(e){
    this.setData({
      showEidtInputer:false
    })
    this.updateNewFundPolicy(e.detail);
  },

  //接收编辑输入组件回传要加入的基金会代码并上传至云端
  getJoinFundCode:function(e){
    this.setData({
      showEidtInputer:false
    })
    this.updateFundApplication(e.detail);
  },

  //接收编辑输入组件回传要监督委员会要加入的基金会代码并直接更新云端
  getCouncilMemberJoinFundCode:function(e){
    const fundCode = e.detail;
    this.setData({
      showEidtInputer:false
    })
    this.updateMemberOfCouncilFund(fundCode);
  },

  //获取其他用户组件回传的删除入会申请的userId
  getDeleteUserApplication:function(e){
    this.pullUserFromFundApplication(e.detail);
  },

  //获取其他用户组件回传的申请加入基金会用户Id
  getJoinUserId:function(e){
    this.updateUserFund(e.detail);
  },

  //获取其他用户组件回传的申请加入基金会用户Id
  getRemoveFundUserObj:function(e){
    this.updateRemoveFundUser(e.detail);
  },

  //接收编辑输入框组件下载的可加入基金会数组并保存在此页面
  getCanJoinFundAry:function(e){
    this.setData({
      canJoinFundAry:e.detail
    })
  },

  //接受修改输入组件传参取消
  getInputerCancel:function(e){
    this.setData({
      showEidtInputer:false
    })
  },

  //接受其他模拟盘用户组件回传关闭参数
  getJoinUserPickerOff:function(e){
    this.setData({
      showJoinUserPicker:false
    })
  },
})