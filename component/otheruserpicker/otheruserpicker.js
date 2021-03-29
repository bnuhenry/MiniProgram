// component/otheruserpicker/otheruserpicker.js
const app = getApp()
const getFundRankInfo = require("../../utils/fundRank.js")

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    checkUserType:{
      type:String,
    },
    otherFundUsersAry:{
      type:Array,
    },
    otherStockUsersAryFromStock:{
      type:Array,
    },
  },

  //组件的初始数据
  data: {
    stockUserStyle:'',
    otherUsersAry:[],
    applicationUsersAry:[],
    otherUserPickerTitle:'',
  },

  //生命周期
  lifetimes: {
    attached: function() {
      this.setData({
        stockUserStyle:'transform:translateY(0);',
      })
      if(this.data.checkUserType == 'stock'){
        this.setData({
          otherUserPickerTitle:'可查询模拟盘用户'
        })
        if(this.data.otherStockUsersAryFromStock.length>0){
          this.setData({
            otherFundUsersAry:this.data.otherStockUsersAryFromStock
          })
          this.makeOtherUserAry(this.data.otherFundUsersAry);
        }else{
          this.getOtherStockUsers();
        }
      }else if(this.data.checkUserType == 'fund'){
        this.setData({
          otherUserPickerTitle:'可捐赠基金会用户'
        })
        if(this.data.otherFundUsersAry.length>0){
          this.makeOtherUserAry(this.data.otherFundUsersAry);
        }else{
          this.getOtherFundUsers();
        }
      }else if(this.data.checkUserType == 'join'){
        this.setData({
          otherUserPickerTitle:'申请加入本会的用户'
        })
        if(app.globalData.fundUserInfo.contribution >= 2500 || app.globalData.fundUserInfo.rank >= 3){
          this.getFundJoinApplicationUsers();
        }
      }else if(this.data.checkUserType == 'removeFundUser'){
        this.setData({
          otherUserPickerTitle:'本基金会其他用户列表'
        })
        if(app.globalData.fundUserInfo.contribution >= 2500 || app.globalData.fundUserInfo.rank >= 3){
          this.getOtherFundUsers();
        }
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    //云函数查询所有除自己之外其他所有模拟盘股票账户信息
    getOtherStockUsers:function(){
      wx.cloud.callFunction({
        name:'stock',
        data: {
          action: 'otherStockUsers',
          userId:app.globalData.userId,
        },
        complete:res=>{
          if(res.result.data.length>0){
            this.makeOtherUserAry(res.result.data);
            this.triggerEvent('otherStockUserAry',res.result.data);
          }else{
            wx.showToast({
              title: '没有其他用户',
              icon:'error',
              duration: 1500
            })
            console.log('除了你之外没有其他老板开通模拟盘账户...');
          }
        }
      })
    },

    //云函数查询所有除自己之外其他所有基金会用户信息
    getOtherFundUsers:function(){
      wx.cloud.callFunction({
        name:'fund',
        data: {
          action: 'otherFundUsers',
          userId:app.globalData.userId,
          fund:app.globalData.fundUserInfo.fund
        },
        complete:res=>{
          if(res.result.data.length>0){
            this.makeOtherUserAry(res.result.data);
            this.triggerEvent('otherFundUsersAry',res.result.data);
          }else{
            wx.showToast({
              title: '没有其他用户',
              icon:'error',
              duration: 1500
            })
            console.log('除了你之外没有其他老板开通基金会账户...');
          }
        }
      })
    },

    //查询申请加入本会的用户列表
    getFundJoinApplicationUsers:function(){
      wx.cloud.callFunction({
        name:'fund',
        data:{
          action:'getFundJoinUserInfo',
          fund:app.globalData.fundUserInfo.fund
        },
        success:res=>{
          if(res.result.list[0].userList.length>0){
            this.makeApplicationUserAry(res.result.list[0].userList);
          }else{
            wx.showToast({
              title: '没有用户申请',
              icon:'error',
              duration: 1500
            })
          }

        },
        fail:res=>{
          console.log(res);
        }
      })
    },

    //根据获取的用户数组生成渲染数组，其他基金会用户或者模拟盘用户
    makeOtherUserAry:function(array){
      const usersAry = array;
      for(let i=0;i<array.length;i++){
        usersAry[i].rankName = getFundRankInfo.getFundRankInfo(array[i].contribution).rankName;
      }
      this.setData({
        otherUsersAry:usersAry
      })
    },

    //根据获取的用户数组生成渲染数组，申请入会用户
    makeApplicationUserAry:function(array){
      const usersAry = array;
      for(let i=0;i<array.length;i++){
        let joinStates = this.getUserCanJoinFund(array[i].fund);
        usersAry[i].states = joinStates.states;
        usersAry[i].canJoin = joinStates.canJoin;
      }
      this.setData({
        applicationUsersAry:usersAry
      })
    },

    //根据用户目前基金会字段判断其是否可以加入组织
    getUserCanJoinFund:function(fund){
      if(fund == 'other'){
        return {
          states:'可以加入',
          canJoin:true
        }
      }else if(fund == app.globalData.fundUserInfo.fund){
        return {
          states:'已经加入本基金会',
          canJoin:false
        }
      }else{
        return {
          states:'已经加入其他基金会',
          canJoin:false
        }
      }
    },

    //点击具体用户信息回传用户信息对象到父组件
    clickOtherUserDetail:function(e){
      const uid = e.currentTarget.dataset.uid;
      this.triggerEvent('otherUserObj',this.data.otherUsersAry[uid]);
      this.cancel();
    },

    removeOtherUserConfirm:function(e){
      const uid = e.currentTarget.dataset.uid;
      const canRemove = this.data.otherUsersAry[uid].contribution<2500 && this.data.otherUsersAry[uid].rank<5;
      if(canRemove){
        wx.showModal({
          title: '确认开除',
          content: '确定要开除'+this.data.otherUsersAry[uid].name+'这位扰乱资本市场的老板？',
          success:res=> {
            if (res.confirm) {
              this.triggerEvent('removeFundUserObj',this.data.otherUsersAry[uid]);
              this.cancel();
              console.log('确定开除');
            } else if (res.cancel) {
              console.log('还是留在本会让其老实交待')
            }
          }
        })
      }else if(this.data.otherUsersAry[uid].rank>=5){
        wx.showToast({
          title: '此人是监管委员',
          icon: 'error',
          duration: 1500
        })
      }else{
        wx.showToast({
          title: '此人是管理层',
          icon: 'error',
          duration: 1500
        })
      }
    },

    //选择确认用户加入本基金会
    confirmUserJoin:function(e){
      const uid = e.currentTarget.dataset.uid;
      wx.showModal({
        title: '批准加入',
        content: '确定接受'+this.data.applicationUsersAry[uid].name+'加入本基金会吗？',
        success:res=> {
          if (res.confirm) {
            this.triggerEvent('joinUserId',this.data.applicationUsersAry[uid]._id);
            this.cancel();
            console.log('正式批准');
          } else if (res.cancel) {
            console.log('需要认真严格细致的审查一番')
          }
        }
      })
    },

    //选择删除用户申请
    deleteUserApplication:function(e){
      const uid = e.currentTarget.dataset.uid;
      wx.showModal({
        title: '确认删除申请',
        content: '确定删除'+this.data.applicationUsersAry[uid].name+'加入本基金会的申请吗？',
        success:res=> {
          if (res.confirm) {
            this.triggerEvent('deleteUserApplication',this.data.applicationUsersAry[uid]._id);
            this.cancel();
            console.log('已发出删除请求');
          } else if (res.cancel) {
            console.log('再看一看')
          }
        }
      })
    },

    //点击取消组件显示
    cancel:function(){
      this.triggerEvent('switchOff',false);
    }
  }
})
