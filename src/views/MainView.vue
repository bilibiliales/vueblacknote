<template>
  <TaskBoard :views="views" status="all" :newTaskStatus="'todo'" />
</template>

<script>
import TaskBoard from '@/components/TaskBoard';

export default {
  name: 'MainView',
  props: { views: Number },
  components: { TaskBoard }
};
</script>