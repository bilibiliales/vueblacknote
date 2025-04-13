<template>
  <div class="tags-settings">
    <!-- 标签列表 -->
    <div class="setting-item">
      <h3>标签管理</h3>
      <div class="tags-container">
        <div v-for="tag in tags" :key="tag.id" class="tag-item">
          <!-- 颜色选择器 -->
          <div class="color-input-wrapper" :style="{ backgroundColor: tag.color }">
            <input type="color" v-model="tag.color" class="color-input" @change="$store.commit('saveState')">
          </div>

          <!-- 可编辑标签名 -->
          <input type="text" v-model="tag.name" class="tag-name-input" @change="$store.commit('saveState')">
          
          <!-- 显示切换开关 -->
          <label class="switch">
            <input type="checkbox" v-model="tag.show" @change="$store.commit('saveState')">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['tags'])
  }
};
</script>

<style scoped>
.tags-settings {
  padding: 20px;
}

.setting-item {
  margin-bottom: 25px;
  padding: 15px;
  padding-bottom: 5px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.setting-item h3 {
  color: #333;
  margin-bottom: 0px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.color-input-wrapper {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-right: 12px;
  position: relative;
}

.color-input {
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.tag-name-input {
  flex: 1;
  margin-right: auto;
  font-size: 16px;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 8px;
  max-width: 120px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.tags-container {
  margin-top: 10px;
}

.tag-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  padding: 7px;
  border-radius: 8px;
  transition: all 0.2s;
}

.tag-item:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateX(5px);
}
</style>