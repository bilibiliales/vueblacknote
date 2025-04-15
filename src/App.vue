<template>
  <div id="app" :style="{backgroundImage: 'url('+backgroundImgUrl+')'}">
    <!-- 左侧菜单栏 -->
    <div id="left-menu" :style="{ backgroundColor: leftMenuBgColor }">
      <div class="points">
        <a href="javascript:;" @click="closeWindow" class="point" id="point1"></a> <!-- 试了浏览器不允许关掉vue-router打开的页面，只能关掉一开始的页面 -->
        <a href="javascript:;" @click="reloadWindow" class="point" id="point2"></a>
        <a href="javascript:;" @click.prevent="toggleFullScreen" class="point" id="point3"></a>
      </div>

      <!-- 收藏菜单 -->
      <div class="menu-section">
        <h5>个人收藏</h5>
        <router-link to="/MainView" class="menu-item" active-class="active" exact>
          <img src="./resource/主页面.png" alt="主页面">
          <span class="text" :style="{ color: textColor }">主页面</span>
        </router-link>
        <router-link to="/pending" class="menu-item" active-class="active" exact>
          <img src="./resource/待完成.png" alt="待完成">
          <span class="text" :style="{ color: textColor }">待完成</span>
        </router-link>
        <router-link to="/completed" class="menu-item" active-class="active" exact>
          <img src="./resource/已完成.png" alt="已完成">
          <span class="text" :style="{ color: textColor }">已完成</span>
        </router-link>
      </div>

      <!-- 标签菜单 -->
      <div class="menu-section">
        <h5>标签</h5>
        <div v-for="tag in this.$store.state.tags" v-show="tag.show" :key="tag.id">
          <router-link :to="`/tag/${tag.id}`" class="menu-item" active-class="active" exact>
            <div class="tag-color" :style="{backgroundColor: tag.color}"></div>
            <span class="text" :style="{ color: textColor }">{{ tag.name }}</span>
          </router-link>
        </div>
      </div>

      <hr>

      <!-- 回收站 -->
      <h5>回收站</h5>
      <div class="menu-section">
        <router-link to="/trash" class="menu-item" active-class="active" exact>
          <img src="./resource/回收站.png" alt="回收站">
          <span class="text" :style="{ color: textColor }">回收站</span>
        </router-link>
      </div>
    </div>

    <!-- 顶部菜单区 -->
    <div id="top-menu" :style="{ backgroundColor: topMenuBgColor }">
      <div class="nav-controls">
        <button class="nav-btn" @click="$router.go(-1)">&lt;</button>
        <button class="nav-btn" @click="$router.go(1)">&gt;</button>
        <span class="current-title">{{ currentTitle }}</span>
        <div v-if="this.$store.state.preferences.pause_save_state" style="height: 30px; width: 30px; margin-top: 5px;">
          <img src="./resource/取消保存.png" alt="取消保存">
        </div>
      </div>
      
      <div class="view-controls">
        <button class="view-btn":class="{ 'active': views === 1 }" @click="views = 1">
          <img src="./resource/列表.png" alt="列表视图">
        </button>
        <button class="view-btn":class="{ 'active': views === 2 }" @click="views = 2">
          <img src="./resource/卡片.png" alt="卡片视图">
        </button>
      </div>
      
      <div class="toolbar-controls">
        <button class="toolbar-btn" @click="openPreferences('backup')">
          <img src="./resource/导出.png" alt="导出">
        </button>
        <button class="toolbar-btn" @click="openPreferences('tags')">
          <img src="./resource/标签.png" alt="标签">
        </button>
        <button class="toolbar-btn" @click="openPreferences('basic')">
          <img src="./resource/设置.png" alt="设置">
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div id="main-content">
      <transition name="main-fade" mode="out-in">
        <router-view :views="views"/>
      </transition>
    </div>

    <div class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank">湘ICP备2025112469号-1</a>
      <img src="./resource/备案图标.png" alt="湘公网安备43010202001893号" style="max-width: 16px; max-height: 16px;">
      <a href="https://beian.mps.gov.cn/#/query/webSearch?code=43010202001893" rel="noreferrer" target="_blank">湘公网安备43010202001893号</a>
    </div>

    <!-- 偏好设置模态窗口 -->
    <Preferences 
      :isVisible="showPreferences" 
      :currentTab="currentTab"
      :views="views" 
      @tab-change="currentTab = $event"
      @close="showPreferences = false" 
    />
  </div>
</template>

<script>
import Preferences from '@/views/set/preferences.vue'
export default {
  name: 'App',
  components: {
    Preferences
  },
  data() {
    return {
      // 运行时参数
      views: 1,
      currentTitle: '',
      showPreferences: false,
      currentTab: 'basic',
      backgroundImgUrl: ""
    };
  },
  created() {
    this.views=this.$store.state.preferences.default_view;
    this.link_to_homepage();
    this.changeBackground();
  },
  methods: {
    // 背景图片切换
    changeBackground() {
      if(this.$store.state.preferences.background_img===0){
        if(this.$store.state.preferences.dark) {
          this.backgroundImgUrl = '';
        }else{
          this.backgroundImgUrl = '';
        }
      }
      if(this.$store.state.preferences.background_img===1){
        this.backgroundImgUrl = require('./resource/1.jpg');
      }
      if(this.$store.state.preferences.background_img===2){
        this.backgroundImgUrl = require('./resource/2.jpg');
      }
      if(this.$store.state.preferences.background_img===3){
        this.backgroundImgUrl = require('./resource/3.jpg');
      }
      if(this.$store.state.preferences.background_img===4){
        this.backgroundImgUrl = require('./resource/4.jpg');
      }
      if(this.$store.state.preferences.background_img===5){
        this.backgroundImgUrl = require('./resource/5.jpg');
      }
      if(this.$store.state.preferences.background_img===6){
        this.backgroundImgUrl = require('./resource/6.jpg')
      }
    },
    // 跳转默认页面
    link_to_homepage() {
      const homepage = this.$store.state.preferences.homepage || 'MainView'
      if (this.$route.path !== `/${homepage}`){
        this.$router.push({ path: `/${homepage}` });
      }
    },

    // 窗口控制方法
    closeWindow() { window.close() },
    reloadWindow() { location.reload() },
    
    toggleFullScreen() {
      !document.fullscreenElement 
        ? document.documentElement.requestFullscreen()
        : document.exitFullscreen()
    },

    // 偏好设置控制
    openPreferences(tabComponent) {
      this.currentTab = tabComponent;
      this.showPreferences = true;
    },

    // 标题更新
    updateTitle(title) { this.currentTitle = title },
    updateCurrentTitle() {
      this.currentTitle = this.$route.meta.title || '根目录'
    }
  },
  computed: {
    leftMenuBgColor() {
      const color = this.$store.state.preferences.item_color;
      const rgbaColor = color+"CC";
      return rgbaColor;
    },
    topMenuBgColor() {
      const color = this.$store.state.preferences.item_color;
      const rgbaColor = color+"D8";
      return rgbaColor;
    },
    textColor() {
      return this.$store.state.preferences.dark ? '#333333' : '#ffffff';
    }
  },
  watch: {
    '$route'(to, from) {
      this.updateCurrentTitle()
    },
    //监测背景序号更改
    '$store.state.preferences.background_img'(newVal) {
      this.changeBackground()
    }
  },
  mounted() {
    this.updateCurrentTitle()
  },
};
</script>

<style>
  body {
    height: 100%;
    margin: 0;
    padding: 0;
  }

  .icp-footer {
    position: fixed;
    width: 100%;
    text-align: center;
    bottom: 10px;
    font-size: 14px;
  }

  .icp-footer a {
    color: #888;
    text-decoration: none;
    transition: color 0.3s;
  }

  .icp-footer a:hover {
    color: #555;
  }

  .text {
    transition: all 0.3s;
  }

  #app {
    display: flex;
    min-height: 100vh;
    background-size: 100% 100%;
    background-attachment: fixed;
  }

  #left-menu {
    width: 260px;
    height: 100%;
    border-right: 1px solid #e0e0e0;
    backdrop-filter: blur(8px);
    padding: 20px;
    position: fixed;
  }

  #main-content {
    flex: 1;
    padding: 20px;
  }

  .menu-section {
    margin-bottom: 20px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 8px;
    color: #333;
    text-decoration: none;
    border-radius: 8px;
    transition: all 0.3s;
  }

  .menu-item.active {
    background: rgba(0, 0, 0, 0.1);
    color: #000;
  }

  .menu-item:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .menu-item img {
    width: 24px;
    height: 20px;
    margin-right: 8px;
  }

  .tag-color {
    display: inline-block;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    cursor: pointer;
    margin-left: 5px;
    margin-right: 15px;
    transition: filter 0.2s;
  }

  .tag-color:hover {
    filter: brightness(0.9);
  }

  h5 {
    color: #b5b5b5;
    font-size: 16px;
    text-transform: uppercase;
    font-weight: 600;
    margin: 15px 0 10px;
    padding-left: 8px;
  }

  .point {
    display: inline-block;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    border: 1px solid;
    cursor: pointer;
    margin-left: 5px;
    transition: filter 0.2s;
  }
  
  .point:hover {
    filter: brightness(0.9);
  }
  
  #point1 {
    background-color: #ed695f;
    border-color: #de493b;
  }
  
  #point2 {
    background-color: #f4bd4f; 
    border-color: #e9ae3d;
  }
  
  #point3 {
    background-color: #5fc153;
    border-color: #43af2f;
  }



  #top-menu {
    position: fixed;
    top: 0;
    left: 300px;
    right: 0;
    height: 80px;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(8px);
    justify-content: space-between;
    padding: 0 20px;
  }

  button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
  }

  .nav-btn {
    margin-left: 20px;
    font-size: 30px;
    color: #aaa;
    transition: all 0.2s;
  }
  
  .nav-btn:hover {
    color: #424245;
  }

  .current-title {
    color: #5e5e61;
    margin-left: 20px;
    font-size: 24px;
    font-weight: 600;
  }

  .view-controls.active {
    filter: brightness(0.9);
  }

  .nav-controls {
    display: flex;
  }
  
  .nav-controls img, .view-controls img, .toolbar-controls img {
    margin-right: 15px;
    width: 30px;
    height: 30px;
    transition: all 0.2s;
    border-radius: 3px;
  }

  .view-btn {
    display: inline;
    margin-right: 15px;
    width: 30px;
    height: 30px;
    transition: all 0.2s;
    border-radius: 3px;
  }

  .view-btn.active {
    background: rgba(0, 0, 0, 0.1);
  }

  .view-controls img:hover, .toolbar-controls img:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  #main-content {
    margin-left: 301px;
    margin-top: 80px;
  }

</style>