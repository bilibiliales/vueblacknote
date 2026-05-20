<template>
  <TaskBoard :views="views" status="all" :newTaskStatus="'todo'" />
</template>

<script>
import TaskBoard from '@/components/TaskBoard.vue';

export default {
  name: 'MainView',
  props: { views: Number },
  components: { TaskBoard }
};
</script>
