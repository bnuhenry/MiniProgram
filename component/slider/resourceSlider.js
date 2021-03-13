const app = getApp()

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    contriTypeFromPage:{
      type:Number
    },
    otherFundUsersAry:{
      type:Array
    },
    peaNutMax:{
      type:Number
    },
    xiaoCaiMax:{
      type:Number
    },
    jianNanChunMax:{
      type:Number
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sliderStyle:'',
    peaNut:0,
    xiaoCai:0,
    jianNanChun:0,
    contriDisable:true,
    allInDisable:true,
    contributionResult:'',
    contriType:1,
    contriTitle:'',
    showFundUserPicker:false,
    resGiveToUserObj:{},
    resGiveToUserName:'其他人',
    gotContriUserObj:false,
  },

  //生命周期
  lifetimes: {
    attached: function() {
      const enable = this.data.peaNutMax>0||this.data.xiaoCaiMax>0||this.data.jianNanChunMax>0;
      this.setData({
        allInDisable:!enable,
        sliderStyle:'transform:translateY(0);',
        contriType:this.data.contriTypeFromPage,
        contriTitle:this.data.contriTypeFromPage == 1?'捐赠给基金会(可获取声望)':'捐赠给其他人(可交流感情)',
      })
    }
  },
  
  /**
   * 组件的方法列表
   */
  methods: {
    peanutChange:function(e){
      this.setData({
        peaNut:e.detail.value
      })
      this.checkContriDis();
    },
    xiaocaiChange:function(e){
      this.setData({
        xiaoCai:e.detail.value
      })
      this.checkContriDis();
    },
    wine_jncChange:function(e){
      this.setData({
        jianNanChun:e.detail.value
      })
      this.checkContriDis();
    },
    checkContriDis:function(){
      const enable = this.data.peaNut>0||this.data.xiaoCai>0||this.data.jianNanChun>0;
      this.setData({
        contriDisable:!enable
      })
    },

    //点击捐赠给基金会
    contriToFund:function(){
      if(this.data.contriTitle!=1){
        this.setData({
        contriType:1,
        contriTitle:'捐赠给基金会(可获取声望)',
        })
      }

    },

    //点击捐赠给其他人
    contriToOtherFundUser:function(){
      this.setData({
        contriType:2,
        contriTitle:'捐赠给其他人(可交流感情)',
        showFundUserPicker:true,
      })

    },

    //东西全部捐赠
    getAllIn:function(){
      let title;
      let content;
      const peanut = this.data.peaNutMax;
      const xiaocai = this.data.xiaoCaiMax;
      const wine_jnc = this.data.jianNanChunMax;
      this.setData({
        contributionResult:''
      });
      if(this.data.contriType == 1){
        title = 'ALL IN!';
        content = '确定全部捐献给基金会？'
      }else if(this.data.contriType == 2&&this.data.gotContriUserObj){
        title = '全部给他！';
        content = '确定全部送给'+this.data.resGiveToUserObj.name+'？'
      }
      if(this.data.contriType == 1||(this.data.contriType == 2&&this.data.gotContriUserObj)){
        wx.showModal({
          title: title,
          content: content,
          success:res=> {
            if (res.confirm) {
              this.setData({
                contributionResult:'已经全部捐出'
              });
              this.updateContributorResData(peanut,xiaocai,wine_jnc);
              console.log('全部捐出！');
            } else if (res.cancel) {
              console.log('我再想想')
            }
          }
        })
      }else if(this.data.contriType == 2&&!this.data.gotContriUserObj){
        this.contriToOtherFundUser();
      }
    },

    //点击确认捐出
    getContribution:function(){
      let title;
      let content;
      const peanut = this.data.peaNut;
      const xiaocai = this.data.xiaoCai;
      const wine_jnc = this.data.jianNanChun;
      this.setData({
        contributionResult:''
      });
      if(this.data.contriType == 1){
        title = '捐献酒菜';
        content = '确定捐献给基金会？'
      }else if(this.data.contriType == 2&&this.data.gotContriUserObj){
        title = '赠送酒菜';
        content = '确定送给'+this.data.resGiveToUserObj.name+'？'
      }
      if(this.data.contriType == 1||(this.data.contriType == 2&&this.data.gotContriUserObj)){
        wx.showModal({
          title: title,
          content: content,
          success:res=> {
            if (res.confirm) {
              this.updateContributorResData(peanut,xiaocai,wine_jnc);
              console.log('已经捐出！');
            } else if (res.cancel) {
              console.log('我再想想')
            }
          }
        })
      }else if(this.data.contriType == 2&&!this.data.gotContriUserObj){
        this.contriToOtherFundUser();
      }
    },

    //捐赠者云端更新扣除捐赠物资，根据捐赠类型决定转换成声望还是捐赠对象物资
    updateContributorResData:function(peanut,xiaocai,wine_jnc){
      let score = 0;
      const peanutscore = 1;
      const xiaocaiscore = 3;
      const wine_jncscore = 5;
      if(this.data.contriType==1){
        score = peanut*peanutscore + xiaocai*xiaocaiscore + wine_jnc*wine_jncscore;
      }
      wx.showLoading({
        title: '加载中',
      })
      const DB = wx.cloud.database();
      const _ = DB.command;
      DB.collection("account").doc(app.globalData.userId).update({
        data:{
          peanut:_.inc(-peanut),
          xiaocai:_.inc(-xiaocai),
          wine_jnc:_.inc(-wine_jnc),
          contribution:_.inc(score)
        },
        success:res=>{
          wx.hideLoading();
          if(res.stats.updated>0){
            console.log("捐献成功");
            this.setData({
              contributionResult:'已经捐出'
            });
            if(this.data.contriType==2){
              this.updateUserObjResData(peanut,xiaocai,wine_jnc);
            }else{
              wx.showToast({
                title: '捐赠成功',
                icon: 'success',
                duration: 2000
              })
            }
            this.triggerEvent('contriResult',this.data.contributionResult);
            this.triggerEvent('contriResultBool',true);
          }else{
            this.setData({
              contributionResult:'捐献失败'
            });
            wx.showToast({
              title: '捐献失败',
              icon: 'error',
              duration: 2000
            })
            console.log("捐献失败")
            this.triggerEvent('contriResultBool',false);
          }
        },
        fail:res=>{
          wx.hideLoading();
          this.setData({
            contributionResult:'更新云数据失败'
          });
          wx.showToast({
            title: '更新数据失败',
            icon: 'error',
            duration: 2000
          })
          console.log("更新云数据失败")
          this.triggerEvent('contriResultBool',false);
        }
      })
    },

    //更新云端捐赠用户对象物资
    updateUserObjResData:function(peanut,xiaocai,wine_jnc){
      wx.showLoading({
        title: '加载中',
      })
      const DB = wx.cloud.database();
      const _ = DB.command;
      wx.cloud.callFunction({
        name:'login',
        data: {
          action: 'contriToOtherFundUser',
          userId:this.data.resGiveToUserObj._id,
          fromuserId:app.globalData.userId,
          peanut:peanut,
          xiaocai:xiaocai,
          wine_jnc:wine_jnc
        },
        complete:res=>{
          if(res.result.stats.updated>0){
            wx.hideLoading();
            wx.showToast({
              title: '已送给'+this.data.resGiveToUserObj.name,
              icon: 'success',
              duration: 2000
            })
            console.log('捐赠给'+this.data.resGiveToUserObj.name+'成功');
          }else{
            wx.hideLoading();
            wx.showToast({
              title: '赠送失败',
              icon: 'error',
              duration: 2000
            })
            console.log('赠送失败');
          }
        }
      })
    },

    //传入参数获取此账户信息发送股票账户信息请求
    getOtherUserObj:function(e){
      const userObj = e.detail;
      this.setData({
        resGiveToUserObj:userObj,
        resGiveToUserName:userObj.name,
        gotContriUserObj:true
      })
    },

    //接受用户选择列表组件回传的其他基金会用户数组
    getOtherFundUserAry:function(e){
      this.triggerEvent('otherFundUserAry',e.detail)
    },

    //接受其他模拟盘用户组件回传关闭参数
    getFundUserPickerOff:function(e){
      this.setData({
        showFundUserPicker:e.detail
      })
    },

    //点击取消
    cancel:function(){
      this.triggerEvent('sliderShow',false)
    }
  }
})
