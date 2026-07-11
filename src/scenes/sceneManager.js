// Scene stack. Top scene gets update() + input; all scenes render bottom-up
// (so modals overlay gameplay). Scene interface (all optional):
//   enter(), update(dt), render(ctx), onPointer(e), name

const stack = [];

export const scenes = {
  replace(s) {
    stack.length = 0;
    stack.push(s);
    s.enter && s.enter();
  },
  push(s) {
    stack.push(s);
    s.enter && s.enter();
  },
  pop() { return stack.pop(); },
  top() { return stack[stack.length - 1] || null; },
  all() { return stack; },
  find(name) { return stack.find(s => s.name === name) || null; },
};
