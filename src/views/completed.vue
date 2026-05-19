<template>
  <TaskBoard :views="views" status="done" :newTaskStatus="'done'" />
</template>

<script>
import TaskBoard from '@/components/TaskBoard';

export default {
  name: 'Completed',
  props: { views: Number },
  components: { TaskBoard }
};
</script>