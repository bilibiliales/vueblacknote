<!-- Preferences.vue -->
<template>
  <div v-if="isVisible" class="preferences-overlay" @click.self="close">
    <div class="preferences-window" :style="{ backgroundColor: menuBgColor }">
      <div class="points">
        <a href="javascript:;" @click="close" class="point" id="point1"></a>
        <a href="javascript:;" @click.prevent="" class="point" id="point2"></a>
        <a href="javascript:;" @click.prevent="" class="point" id="point3"></a>
        <span style="color: #5e5e61; margin-left: 20%;">“小黑记事本”偏好设置</span>
      </div>
      <!-- 顶部导航栏 -->
      <nav class="preferences-nav">
        <button v-for="(tab, index) in tabs" :key="index" @click="selectTab(tab.path)" :class="{ 'active': currentTab === tab.path }" class="nav-item">
          <span class="text" :style="{ color: textColor }">{{ tab.name }}</span>
        </button>
      </nav>
      <div class="modal-body">
        <!-- 动态加载设置项 -->
        <component :is="currentTab"></component>
      </div>
    </div>
  </div>
</template>
<script>
  import Basic from '@/views/set/basic.vue'
  import Tags from '@/views/set/tags.vue'
  import Backup from '@/views/set/backup.vue'
  import Advance from '@/views/set/advance.vue'

  export default {
    props: {
      isVisible: Boolean,
      currentTab: String
    },
    components: {
      Basic, Tags, Backup, Advance,
    },
    data() {
        return {
          tabs: [
            { name: '通用', path: 'basic' },
            { name: '标签', path: 'tags' },
            { name: '备份', path: 'backup' },
            { name: '高级', path: 'advance' }
          ]
        }
      },
    methods: {
      close() {
        this.$emit('close');
      },
      selectTab(tabItem) {
        this.$emit('tab-change', tabItem);
      }
    },
    computed: {
      menuBgColor() {
        const color = this.$store.state.preferences.item_color;
        const rgbaColor = color+"CC";
        return rgbaColor;
      },
      textColor() {
        return this.$store.state.preferences.dark ? '#333333' : '#ffffff';
      }
    }
  }
</script>
  
  <style scoped>
  .point {
    margin-top: 20px;
    margin-left: 20px;
    align-items: center;
    transition: filter 0.2s;
  }
  
  .point:hover {
    filter: brightness(0.9);
  }
  
  #point2, #point3 {
    background-color: #c9c9c9; 
    border-color: #53a5fc;
    margin-left: 5px;
  }
  
  .preferences-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .preferences-window {
    width: 650px;
    height: 600px;
    border-radius: 10px;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.15);
  }
  
  .preferences-nav {
    display: flex;
    padding: 16px;
    border-bottom: 1px solid #eee;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }
  
  .nav-item {
    padding: 10px 20px;
    margin-right: 12px;
    border-radius: 5px;
    transition: all 0.2s;
    text-decoration: none;
    font-size: 18px;
    color: #333333;
    display: flex;
    align-items: center;
  }
  
  .nav-item:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .nav-item.active {
    background: rgba(0, 0, 0, 0.1);
    color: #000000;
  }
  
  .preferences-content {
    padding: 24px;
  }
  
  </style>