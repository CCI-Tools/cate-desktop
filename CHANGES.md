### 0.8.0-rc.5.dev.0

1. fixed problem where existence of `~/.cate` was not checked before it was accessed.

### 0.8.0-rc.4

1. fixed problem where Cate backend couldn't be started (cause: wrong stdio config for node's `child_process.spawn()`)
2. fixed problem where Cate backend couldn't be stopped (cause: the backend was invoked without activated Python env)
