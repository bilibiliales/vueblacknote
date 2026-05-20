<template>
  <TaskBoard :views="views" status="todo" :newTaskStatus="'todo'" />
</template>

<script>
import TaskBoard from '@/components/TaskBoard.vue';

export default {
  name: 'Pending',
  props: { views: Number },
  components: { TaskBoard }
};
</script>
