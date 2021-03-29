
Component({

  //组件的属性列表
  properties: {
    editInputerType:{
      type:String
    },
    userName:{
      type:String
    },
    recentFundPolicy:{
      type:String
    },
    canJoinFundAry:{
      type:Array
    },
    userId:{
      type:String
    },
    userFund:{
      type:String
    },
  },


  // 组件的初始数据
  data: {
    newResult:'',
    placeholder:'',
    editMsg:'',
    editTitle:'',
    submitButtonTitle:'',
    wantToJoinFund:String,
    wantToJoinFundName:'请选择',
    submieButtonDisable:false,
    fundNameAry:[],
    inputFormStyle:'',
  },

  //生命周期函数
  lifetimes: {
    attached: function() {
      this.setData({
        inputFormStyle:'opacity: 1;'
      })
      if(this.data.editInputerType == 'name'){
        this.setData({
          editTitle:'修改名字',
          newResult:this.data.userName,
          submitButtonTitle:'确认修改',
          placeholder:'请输入新名字，不要太长',
        })
      }else if(this.data.editInputerType == 'slogan'){
        this.setData({
          editTitle:'请制定目前基金会口号',
          submitButtonTitle:'喊出口号',
          placeholder:'喊出你的口号',
        })
      }else if(this.data.editInputerType == 'joinFund'){
        if(this.data.canJoinFundAry.length == 0){
          this.getCanJoinFundAry();
        }
        this.setData({
          editTitle:'选择加入一个基金会',
          submitButtonTitle:'提交申请',
          submieButtonDisable:true,
          fundNameAry:this.makeJoinFundNameAry(this.data.canJoinFundAry),
        })
      }else if(this.data.editInputerType == 'councilMemberJoinFund'){
        if(this.data.canJoinFundAry.length == 0){
          this.getCanJoinFundAry();
        }
        this.setData({
          editTitle:'选择一个基金会直接加入',
          submitButtonTitle:'确认加入',
          submieButtonDisable:true,
          fundNameAry:this.makeJoinFundNameAry(this.data.canJoinFundAry),
        })
      }
    }
  },
  // 组件的方法列表
  methods: {
    //输入框绑定
    bindEditInput:function(e){
      this.setData({
        newResult: e.detail.value
      })
    },

    //点击确定修改
    changeConfirm:function(){
      if(this.data.editInputerType == 'name'){
        this.changeUserName();
      }else if(this.data.editInputerType == 'slogan'){
        this.changeFundPolicy();
      }else if(this.data.editInputerType == 'joinFund'){
        this.joinFundConfirm();
      }else if(this.data.editInputerType == 'councilMemberJoinFund'){
        this.councilMemberJoinFundConfirm();
      }
    },

    //修改名字
    changeUserName:function(){
      const nameLength = this.data.newResult.length;
      if(nameLength==0){
        this.setData({
          editMsg:'不要留白，填点什么'
        })
      }else if(nameLength>=12){
        this.setData({
          editMsg:'太长了，没法搞'
        })
      }else if(this.data.userName == this.data.newResult){
        this.setData({
          editMsg:'跟原名字一样，没有修改过'
        })
      }else{
        wx.showModal({
          title: '修改名字',
          content: '确定使用’'+this.data.newResult+'’作为新名字吗？',
          success:res=> {
            if (res.confirm) {
              console.log('修改名字启动');
              this.setData({
                editMsg:'修改中...',
              })
            this.triggerEvent('changeUserName',this.data.newResult);
            } else if (res.cancel) {
              this.setData({
                editMsg:'让我冷静一下'
              })
            }
          }
        })
      }
    },

    //点击喊出口号按钮
    changeFundPolicy:function(){
      if(this.data.newResult==this.data.recentFundPolicy){
        this.setData({
          editMsg:'跟原来的口号一样，来点实际的'
        })
      }else if(this.data.newResult.length==0){
        this.setData({
          editMsg:'真的是空谈？'
        })
      }else{
        wx.showModal({
          title: '修改方针政策',
          content: '确定喊出’'+this.data.newResult+'’这种空谈误国的口号吗？',
          success:res=> {
            if (res.confirm) {
              console.log('修改口号启动');
              this.setData({
                editMsg:'正在蓄力喊出口号...',
              })
              this.triggerEvent('changeFundSlogan',this.data.newResult);
            } else if (res.cancel) {
              this.setData({
                editMsg:'让我冷静一下...'
              })
            }
          }
        })
      }
    },

    // 加入基金会点击递交申请
    joinFundConfirm:function(){
      if(this.data.wantToJoinFund){
        wx.showModal({
          title:'提交申请',
          content:'确定要加入'+this.data.wantToJoinFundName+'这个奇怪的组织吗?',
          success:res=> {
            if (res.confirm) {
              console.log('确定踩'+this.data.wantToJoinFundName+'这个坑');
              this.triggerEvent('joinFundCode',this.data.wantToJoinFund);
            } else if (res.cancel) {
              console.log('真是难以选择，我还要认真考虑下')
            }
          }
        })
      }
    },

    // 基金业监督委员会成员加入基金会点击递交申请
    councilMemberJoinFundConfirm:function(){
    if(this.data.wantToJoinFund){
      wx.showModal({
        title:'巡视基金会',
        content:'确定要进入'+this.data.wantToJoinFundName+'这个基金会开展巡视审计工作吗?',
        success:res=> {
          if (res.confirm) {
            console.log('确定进入'+this.data.wantToJoinFundName);
            this.triggerEvent('councilMemberJoinFundCode',this.data.wantToJoinFund);
          } else if (res.cancel) {
            console.log('遇到了一些阻力，先缓一缓')
          }
        }
      })
    }
  },

    //可加入基金会列表选择器监听变化
    bindCanJoinFundChange:function(e){
      const index = Number(e.detail.value);
      const applicationPresented = this.data.canJoinFundAry[index].join_application.includes(this.data.userId);
      this.setData({
        wantToJoinFundName:this.data.canJoinFundAry[index].fund_name,
        submitButtonTitle:applicationPresented?'已经提交过':'提交申请',
        submieButtonDisable:applicationPresented
      })
      this.data.wantToJoinFund = this.data.canJoinFundAry[index].fund;
    },

    //基金业监督委员会成员加入基金会列表选择器监听变化
    bindMemberCouncilCanJoinFundChange:function(e){
      const index = Number(e.detail.value);
      const alreadyJoined = this.data.canJoinFundAry[index].fund == this.data.userFund;
      this.setData({
        wantToJoinFundName:this.data.canJoinFundAry[index].fund_name,
        submitButtonTitle:alreadyJoined?'已经加入此会':'确认加入',
        submieButtonDisable:alreadyJoined
      })
      this.data.wantToJoinFund = this.data.canJoinFundAry[index].fund;
    },

    //页面传入的可加入基金会数据筛选出基金会名字数组
    makeJoinFundNameAry:function(fundAry){
      const fundNameAry = [];
      for(let i = 0;i<fundAry.length;i++){
        fundNameAry.push(fundAry[i].fund_name);
      }
      return fundNameAry;
    },

    //云端获取可加入基金会列表
    getCanJoinFundAry:function(){
      wx.cloud.callFunction({
        name:'fund',
        data:{
          action:'getAllFundName'
        },
        complete:res=>{
          const fundNameAry = [];
          this.triggerEvent('renewCanJoinFundAry',res.result.data);
          for(let i = 0;i<res.result.data.length;i++){
            fundNameAry.push(res.result.data[i].fund_name);
          }
          this.setData({
            fundNameAry:fundNameAry,
          })
        }
      })
    },

    cancel:function(){
      this.triggerEvent('cancelInputer',false)
    }
  }
})
