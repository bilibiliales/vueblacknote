import Vue from 'vue'
import Router from 'vue-router'

//主路由组件
import pending from '@/views/pending'
import completed from '@/views/completed'
import tag from '@/views/tag'
import trash from '@/views/trash'
import MainView from '@/views/MainView'
import root from '@/views/root'
import empty from '@/views/empty'
import edit from '@/views/edit.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: root,
      meta: { title: '根目录' }
    },
    {
      path: '/undefined',
      component: empty,
      meta: { title: '空目录' }
    },
    {
      path: '/MainView',
      component: MainView,
      meta: { title: '主页面' }
    },
    {
      path: '/pending',
      component: pending,
      meta: { title: '待完成' }
    },
    {
      path: '/completed',
      component: completed,
      meta: { title: '已完成' }
    },
    {
      path: '/tag/:id',
      component: tag,
      meta: { title: '标签筛选' }
    },
    {
      path: '/trash',
      component: trash,
      meta: { title: '回收站' }
    },
    {
      path: '/edit/:n_id',
      component: edit,
      meta: { title: '编辑任务' }
    }
  ]
})
