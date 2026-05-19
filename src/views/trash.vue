<template>
  <TaskBoard :views="views" status="remove" :showNewTask="false" :showForceDelete="true" :showEditButton="false" />
</template>

<script>
import TaskBoard from '@/components/TaskBoard';

export default {
  name: 'Trash',
  props: { views: Number },
  components: { TaskBoard }
};
</script>