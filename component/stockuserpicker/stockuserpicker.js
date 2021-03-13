// component/stockuserpicker/stockuserpicker.js
const app = getApp()

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
            console.log('除了你之外没有其他老板开通模拟盘账户...');
          }
        }
      })
    },

    //云函数查询所有除自己之外其他所有基金会用户信息
    getOtherFundUsers:function(){
      wx.cloud.callFunction({
        name:'login',
        data: {
          action: 'otherFundUsers',
          userId:app.globalData.userId,
        },
        complete:res=>{
          if(res.result.data.length>0){
            this.makeOtherUserAry(res.result.data);
            this.triggerEvent('otherFundUserAry',res.result.data);
          }else{
            console.log('除了你之外没有其他老板开通基金会账户...');
          }
        }
      })
    },

    //根据获取的用户数组生成渲染数组
    makeOtherUserAry:function(array){
      const usersAry = array;
      for(let i=0;i<array.length;i++){
        usersAry[i].rankName = this.makeRankName(array[i].contribution);
      }
      this.setData({
        otherUsersAry:usersAry
      })
    },

    makeRankName:function(contribution){
      //通过捐赠值获取基金会位阶
      if(contribution<200){
        return '实习生';
      }else if(200<=contribution&&contribution<500){
        return '干事';
      }else if(500<=contribution&&contribution<1000){
        return '操盘手';
      }else if(1000<=contribution&&contribution<1500){
        return '风控专员';
      }else if(1500<=contribution&&contribution<2500){
        return '秘书长';
      }else if(2500<=contribution&&contribution<5000){
        return '基金经理';
      }else if(5000<=contribution&&contribution<10000){
        return '副会长';
      }else if(10000<=contribution&&contribution<20000){
        return '会长';
      }else if(contribution>=20000){
        return '董事长';
      }else{
        return '保安';
      }
    },

    //点击具体用户信息回传用户信息对象到父组件
    clickOtherUserDetail:function(e){
      const uid = e.currentTarget.dataset.uid;
      this.triggerEvent('otherUserObj',this.data.otherUsersAry[uid]);
      this.cancel();
    },

    //点击取消组件显示
    cancel:function(){
      this.triggerEvent('switchOff',false);
    }
  }
})
