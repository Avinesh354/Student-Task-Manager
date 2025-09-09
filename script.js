const LS_KEY = 'stm_tasks_v1';
const taskForm = document.getElementById('taskForm');
const titleIn = document.getElementById('title');
const descIn = document.getElementById('description');
const deadlineIn = document.getElementById('deadline');
const statusSelect = document.getElementById('statusSelect');
const taskList = document.getElementById('taskList');
const progressText = document.getElementById('progressText');
const remainingText = document.getElementById('remainingText');
const barFill = document.getElementById('barFill');
const filterStatus = document.getElementById('filterStatus');
const sortBy = document.getElementById('sortBy');
const clearBtn = document.getElementById('clearBtn');
const emptyBox = document.getElementById('empty');

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function loadTasks(){ try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch(e){ return [] } }
function saveTasks(tasks){ localStorage.setItem(LS_KEY, JSON.stringify(tasks)); }

function render(){
  const all = loadTasks();
  const fs = filterStatus.value;
  let filtered = all.filter(t => !fs || t.status === fs);
  if(sortBy.value === 'deadline'){
    filtered.sort((a,b)=>{
      if(!a.deadline && !b.deadline) return 0;
      if(!a.deadline) return 1;
      if(!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  } else {
    filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  taskList.innerHTML = '';
  emptyBox.style.display = filtered.length === 0 ? 'block' : 'none';
  filtered.forEach(t=>{
    const li = document.createElement('li'); li.className = 'task';
    const left = document.createElement('div'); left.className='left';
    const h = document.createElement('h3'); h.textContent = t.title;
    const p = document.createElement('p'); p.textContent = t.description || '';
    const meta = document.createElement('div'); meta.className='meta';
    const tag = document.createElement('span');
    tag.className = 'tag ' + (t.status === 'Pending' ? 'status-pending' : (t.status === 'In Progress'? 'status-inprogress' : 'status-completed'));
    tag.textContent = t.status;
    const dl = document.createElement('span');
    dl.textContent = 'Due: ' + (t.deadline ? new Date(t.deadline).toLocaleString() : 'No deadline');
    const cr = document.createElement('span'); cr.textContent = 'Added: ' + new Date(t.createdAt).toLocaleDateString();
    meta.appendChild(tag); meta.appendChild(dl); meta.appendChild(cr);
    left.appendChild(h); left.appendChild(p); left.appendChild(meta);

    const actions = document.createElement('div'); actions.className='actions';
    const toggle = document.createElement('button'); toggle.textContent = (t.status==='Completed' ? 'Undo' : 'Complete');
    toggle.onclick = ()=> updateTaskStatus(t.id, t.status === 'Completed' ? 'Pending' : 'Completed');
    const editBtn = document.createElement('button'); editBtn.textContent='Edit';
    editBtn.onclick = () => {
      titleIn.value = t.title; descIn.value = t.description || ''; statusSelect.value = t.status;
      if(t.deadline) deadlineIn.value = new Date(t.deadline).toISOString().substring(0,16);
      deleteTask(t.id);
    };
    const del = document.createElement('button'); del.textContent='Delete'; del.className='danger';
    del.onclick = () => { if(confirm('Delete this task?')) deleteTask(t.id); };
    actions.appendChild(toggle); actions.appendChild(editBtn); actions.appendChild(del);
    li.appendChild(left); li.appendChild(actions);
    taskList.appendChild(li);
  });
  updateProgress(all);
}

function updateProgress(tasks){
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const pct = total ? Math.round((completed/total)*100) : 0;
  progressText.textContent = `${completed}/${total} tasks completed (${pct}%)`;
  remainingText.textContent = `${total - completed} remaining`;
  barFill.style.width = pct + '%';
}

function addTask(ev){
  ev.preventDefault();
  const title = titleIn.value.trim();
  if(!title) return alert('Please add title');
  const description = descIn.value.trim();
  const deadline = deadlineIn.value ? new Date(deadlineIn.value).toISOString() : null;
  const status = statusSelect.value;
  const tasks = loadTasks();
  tasks.push({ id: uid(), title, description, deadline, status, createdAt: new Date().toISOString(), notified:false });
  saveTasks(tasks);
  taskForm.reset(); statusSelect.value = 'Pending'; render();
}

function updateTaskStatus(id, newStatus){
  const tasks = loadTasks();
  const idx = tasks.findIndex(t=>t.id===id);
  if(idx === -1) return;
  tasks[idx].status = newStatus;
  if(newStatus === 'Completed') tasks[idx].notified = false;
  saveTasks(tasks); render();
}

function deleteTask(id){
  let tasks = loadTasks();
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks); render();
}

clearBtn.addEventListener('click', ()=> {
  if(confirm('Clear all tasks?')) { localStorage.removeItem(LS_KEY); render(); }
});

function checkOverdue(){
  const tasks = loadTasks(); const now = new Date(); let changed = false;
  tasks.forEach(t=>{
    if(t.deadline && !t.notified && t.status !== 'Completed'){
      const dl = new Date(t.deadline);
      if(dl < now){
        alert('Overdue: ' + t.title + '\nDue: ' + dl.toLocaleString());
        t.notified = true; changed = true;
      }
    }
  });
  if(changed) saveTasks(tasks);
}

setInterval(checkOverdue, 30000);
taskForm.addEventListener('submit', addTask);
filterStatus.addEventListener('change', render);
sortBy.addEventListener('change', render);
render();