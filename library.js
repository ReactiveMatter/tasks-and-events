  class task
  {
    constructor()
    {
      this.id= getUniqueID();
      this.title;
      this.content;
      this.topPriority = false;
      this.dueDate;
      this.dueTime;
      this.creationTime = new Date().getTime();
      this.completionPercent;
      this.completed = false; // false = pending, true = completed
    }
  }

  class event
  {
    constructor()
    {
      this.id= getUniqueID();
      this.title;
      this.content;
      this.venue;
      this.dueDate;
      this.dueTime;
      this.creationTime = new Date().getTime();;
    }
  }

class confDB{
    constructor()
    {
      this.mtime = 0;
      this.username;
      this.theme = 'light';
    }
}

class taskDB
{
  constructor(){
    this.mtime = 0;
    this.tasks = [];
  }
}

class eventDB
{
  constructor(){
    this.mtime = 0;
    this.events = [];
  }
}

var tasks;
var events;
var conf;
var password = null;
var localstorage_prefix = 'app_';
var error = null;
var todayFilter = 'all';
var sortTasks = 'none';
var tasksToday = [];
var eventsToday= [];

document.addEventListener("DOMContentLoaded", (event) => {
  initialize();
  if(password)
  {
    sync();
  }

  document.getElementById('sort-tasks').addEventListener("change", function(){
    sortTasks = document.getElementById('sort-tasks').value;
    localStorage.setItem(localstorage_prefix+'sort', sortTasks);
    renderTasks();
  });

});


//Inititalize important variables and load data from localstorage
function initialize()
{
  //Check if localstorage has data

  let t = JSON.parse(localStorage.getItem(localstorage_prefix+'tasks'));
  if(t)
  {
      tasks = t; 
  }
  else
  {
     tasks = new taskDB();
  }
  let e = JSON.parse(localStorage.getItem(localstorage_prefix+'events'));
  if(e)
  {
    events = e;
  }
  else
  {
     events = new eventDB();
  }

  let c = JSON.parse(localStorage.getItem(localstorage_prefix+'conf'));

  if(c)
  {
      conf = c;
  }
   else
  {
     conf = new confDB();
  }

  let p = localStorage.getItem(localstorage_prefix+'password');
  if(p)
  {
    password = p;
  }

  let s = localStorage.getItem(localstorage_prefix+'sort');
  if(s)
  {
    sortTasks = s;
    document.getElementById('sort-tasks').value = sortTasks;
  }

  if(conf.username)
  {
    document.getElementById('app-username').innerHTML=conf.username;
  }
  else
  {
    document.getElementById('app-username').innerHTML="User";
  }
  

  renderTasks();
  renderEvents();
  parseToday();
  renderToday('all');
  today();

}

function insertHTML(id, code)
{
    let container = document.getElementById(id);
    container.innerHTML = code;
}

//Function to post data to a url via POST
function post(url, data) {

  const params = new URLSearchParams();
  for (const key in data) {
      params.append(key, data[key]);
  }

  return fetch(url, {
        method: 'POST',
        headers: {
        "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(responseData => {
        console.log('Response from server:', responseData);
        // Handle the response data
        return responseData;
    });

}


//function to fetch file via configured API
function fileFetch(f)
{
    let postBody = {};
    postBody.password = password;
    postBody.action = 'get';
    postBody.data = '';
    postBody.filename = f;
    //posting data to remote
    let response = post('api.php', postBody);
    console.log(response);
    return response;
}

//function to upload file via configured API
function filePut(f, content)
{
    let postBody = {};
    postBody.password = password;
    postBody.action = 'post';
    postBody.data = JSON.stringify(content);
    postBody.filename = f;
    //posting data to remote
    let response = post('api.php', postBody);
    console.log(response);
    return response;

}

//function to sync a variable to a file via API
async function syncFile(filename)
{ 

    let local = this[filename];
    return fileFetch(filename).then(function(remote){
    if(remote.code == 4)
    {
      remote = remote.data;
      if(!remote.mtime || (remote.mtime && (local.mtime > remote.mtime)))
      {
        return filePut(filename, local).then(function(r){
          if(r.code == 5)
          {
            console.log(filename+' synced successfully');
          }
          else
          {
            console.log(filename+' sync failed. Error: '+r.message);
          }
        });
      }
      else if(remote.mtime && (local.mtime < remote.mtime))
      { 
        this[filename] = remote;
      }

    }
    else if(remote.code == 3)
    {
        return filePut(filename, local).then(function(r){
          if(r.code == 5)
          {
            console.log(filename+' synced successfully');
          }
          else
          {
            console.log(filename+' sync failed. Error: '+r.message);
          }
        });
        
    }
    else if(remote.code==0)
    {
      error = 'Authentication failed';
    }

    });
   
}

function sync()
{
    document.getElementById('sync-icon').classList.add('rotate');
    let alert = createAlert("Syncing");
    Promise.all([syncFile('tasks'),syncFile('events'),syncFile('conf')]).then(function(){
    document.getElementById('sync-icon').classList.remove('rotate');
    if(error)
    {
      document.getElementById(alert).innerHTML=error;
      error=null;
    }
    else
    {
      document.getElementById(alert).innerHTML='Synced';
    }
    
    setTimeout(function() {
    remove('#'+alert);
    }, 2000);

    saveToLocal();
    initialize();

    });



}

function createAlert(content)
{
   // Generate a unique ID for the box
    const id = 'alert_' + Math.random().toString(36).substr(2, 9);

    // Create a new div element for the box
    const box = document.createElement('div');

    // Set the ID for the box
    box.id = id;
    box.classList.add('alert');
    box.innerHTML = content;

    // Append the box to the DOM
    document.body.appendChild(box);

    // Return the ID of the box
    return id;
}

function saveToLocalByFile(filename)
{
  localStorage.setItem(localstorage_prefix+filename, JSON.stringify(this[filename]));
}

function saveToLocal()
{
  saveToLocalByFile('tasks');
  saveToLocalByFile('events');
  saveToLocalByFile('conf');
}

function purgeLocalStorage()
{
  for (var key in localStorage) {
  if (localStorage.hasOwnProperty(key) && key.startsWith(localstorage_prefix)) {
    localStorage.removeItem(key);
  }
  }

}

function getTask(id)
{
   for (var i = 0; i < tasks.tasks.length; i++) {
      if(tasks.tasks[i].id == id)
      {
        return tasks.tasks[i];
      }
    }
}

function updateTask(id, t)
{
   for (var i = 0; i < tasks.tasks.length; i++) {
      if(tasks.tasks[i].id == id)
      {
        tasks.tasks[i] = t;
        task.mtime = new Date().getTime();
      }
    }
}

function deleteTask(id)
{
    for (var i = 0; i < tasks.tasks.length; i++) {
      if(tasks.tasks[i].id == id)
      {
        tasks.tasks.splice(i, 1);
        tasks.mtime = new Date().getTime();
      }
    }
}

function createEvent(e)
{
    events.events.push(e);
    events.mtime = new Date().getTime();
    return true;
}

function getEvent(id)
{
    for (var i = 0; i < events.events.length; i++) {
      if(events.events[i].id == id)
      {
        return events.events[i];
      }
    }
}

function updateEvent(id, e)
{
      for (var i = 0; i < events.events.length; i++) {
      if(events.events[i].id == id)
      {
       events.events[i] = e;
       events.mtime = new Date().getTime();
      }
    }
}

function deleteEvent(id)
{
    for (var i = 0; i < events.events.length; i++) {
      if(events.events[i].id == id)
      {
        events.events.splice(i, 1);
        events.mtime = new Date().getTime();
      }
    }
}

function loadTheme()
{
  if(conf.theme == 'dark')
  {
    document.querySelector('body').classList.remove('light');
    document.querySelector('body').classList.add('dark');
  }
}

function toggleTheme()
{
  if(conf.theme == 'light')
  {
    conf.theme = 'dark';
    document.querySelector('body').classList.remove('light');
    document.querySelector('body').classList.add('dark');
  }
  else
  {
    conf.theme = 'dark';
    document.querySelector('body').classList.remove('dark');
    document.querySelector('body').classList.add('light');
  }
}

//Data storage code
function getUniqueID()
{
  return Math.floor((Date.now() + Math.random())*100).toString(36);

}

function formatDate(dateString) {
    let parts = dateString.split('-');
    return parts[2] + '-' + parts[1] + '-' + parts[0];
}

function convertTo12HourFormat(time24) {
    // Split the time string into hours and minutes
    let [hours, minutes] = time24.split(':');

    // Convert hours to a number
    hours = parseInt(hours, 10);

    // Determine AM or PM
    let meridiem = hours >= 12 ? 'PM' : 'AM';

    // Convert hours to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)

    // Add leading zero if hours are less than 10
    hours = hours < 10 ? '0' + hours : hours;

    // Pad minutes with leading zero if needed
    minutes = minutes.padStart(2, '0');

    // Return the formatted time
    return `${hours}:${minutes} ${meridiem}`;
}

function humanReadableDate(timestamp)
{ 
  let d = new Date(timestamp);
  let dateSeperator="/"
  let date = d.getDate();
  let month = d.getMonth()+1;
  let year = d.getFullYear();
  let hour = d.getHours();
  hour = ("0" + hour).slice(-2)
  let noon = "am";
  if(hour>12)
  {
    noon = "pm";
  }
  if(hour>13)
  {
    hour = hour-12;
  }
  let minutes = d.getMinutes();

  return d.toLocaleString("en-IN",{ 
  year: "numeric",
  month: "long",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second:"2-digit"
});

}




  const currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  
  let displayMonth = currentMonth;
  let displayYear = currentYear;

  function renderCalendar(month, year) {
    const calendarBody = document.getElementById('calendar-body');
    const monthYearHeader = document.getElementById('month-year');
    calendarBody.innerHTML = '';
    monthYearHeader.textContent = `${getMonthName(month)} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let dateCounter = 1;

    for (let i = 0; i < 6; i++) {
      const row = document.createElement('tr');
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          const cell = document.createElement('td');
          cell.classList.add('day-'+j);
          row.appendChild(cell);
        } else if (dateCounter > daysInMonth) {
           const cell = document.createElement('td');
           cell.classList.add('day-'+j);
            row.appendChild(cell);
        } else {
          const cell = document.createElement('td');
          cell.textContent = dateCounter;
          cell.classList.add('day-'+j);
          if(currentDate.getDate() == dateCounter && currentMonth == month && currentYear == year)
          {
            cell.classList.add('today');
          }
          row.appendChild(cell);
          dateCounter++;
        }
      }
      calendarBody.appendChild(row);
      if (dateCounter > daysInMonth)
      {
        break;
      }
    }
  }

  function today()
  {
    displayMonth = currentMonth;
    displayYear = currentYear;
    renderCalendar(currentMonth, currentYear);
  }

  function prevMonth() {
    displayMonth=displayMonth-1;
    if (displayMonth < 0) {
      displayMonth = 11;
      displayYear = displayYear-1;
    }
    renderCalendar(displayMonth, displayYear);
  }

  function nextMonth() {
    displayMonth=displayMonth+1;
    if (displayMonth > 11) {
      displayMonth = 0;
      displayYear = displayYear+1;
    }
    renderCalendar(displayMonth, displayYear);
  }


  function getMonthName(monthIndex) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  }

function compareTime(time1, time2) {
  const [hours1, minutes1, period1] = time1.split(/:| /);
  const [hours2, minutes2, period2] = time2.split(/:| /);
  
  const totalMinutes1 = parseInt(hours1) * 60 + parseInt(minutes1) + (period1 === 'PM' ? 12 * 60 : 0);
  const totalMinutes2 = parseInt(hours2) * 60 + parseInt(minutes2) + (period2 === 'PM' ? 12 * 60 : 0);
  
  if (totalMinutes1 < totalMinutes2) {
    return -1;
  } else if (totalMinutes1 > totalMinutes2) {
    return 1;
  } else {
    return 0;
  }
}


function closeDialog(id)
{
  document.getElementById(id).close();
}


function toggle(selector)
{
  document.querySelectorAll(selector).forEach(function(e){
    if(e.style.display == 'none')
    {
      e.style.display = 'block';
    }
    else
    {
      e.style.display = 'none';
    }
  });
}

function remove(selector)
{
  document.querySelectorAll(selector).forEach(function(e){
    e.remove();
  });
}

function showTasks()
{
  document.querySelectorAll('#col-one .module').forEach(function(e){
    e.style.display = "none";
  })
  document.getElementById('module-tasks').style.display = "block";
}

function addTaskOpen()
{
  document.querySelectorAll('#col-one .module').forEach(function(e){
    e.style.display = "none";
  })
  document.getElementById('module-add-tasks').style.display = "block";
}

function editTaskOpen(id)
{
  document.querySelectorAll('#col-one .module').forEach(function(e){
    e.style.display = "none";
  })
  document.getElementById('module-edit-tasks').style.display = "block";

  t = getTask(id);

  if(!t.content)
  {
    t.content='';
  }

  document.getElementById('form-task-edit-id').value = id;
  document.getElementById('form-task-edit-title').value = t.title;
  document.getElementById('form-task-edit-content').value = t.content;
  document.getElementById('form-task-edit-date').value = t.dueDate;
  document.getElementById('form-task-edit-time').value = t.dueTime;
  document.getElementById('form-task-edit-priority').checked = t.topPriority;
  document.getElementById('form-task-edit-completed').checked = t.completed;
  document.getElementById('form-task-edit-percentage').value= t.completionPercent;

}


function toggleTaskDetails(id) {
  toggle("div[data-id='"+id+"'] .task-details")
}

function generateTaskHTML(task)
{

  let code=`
  <div class="task" data-id="`+task.id+`">
   <div class='task-head'>
   <div class="title" onclick="toggleTaskDetails('`+task.id+`')">`+task.title+`</div>
   <div class="task-options">`;

   if(task.topPriority)
   {
    code+=`<span class="priority">Top</span>`;
    // code+= `<img src="icons/shield.svg" class='icon'>`;
   }


  if(task.dueDate)
  {
    code+=`<span class="task-date">`+formatDate(task.dueDate)+`</span>`;
  }
  code+=`<img src="icons/check.svg" onclick="completeTask('`+task.id+`')" class="icon" title="Mark this task as complete">
   </div>
   </div>
   <div class="task-details" style="display:none;">`;

   if(task.content)
   {
    code+=`<div class="task-content">`+markdownToHtml(task.content)+`</div>`;
   }

   if(task.dueDate)
   {
     code+=`<div class="task-date-time">
     <span class="task-date">`+formatDate(task.dueDate)+`</span>`;
     if(task.dueTime)
      { code+=`<span class="task-time">`+convertTo12HourFormat(task.dueTime)+`</span>`;}
      code+=`</div>`;
   }
    
    if(task.completionPercent) 
    {
      code+=`<div class="task-percentage">
      <span class="task-percentage-value">`+task.completionPercent+`</span>% completed
      </div>`;
    }
      
    code+=`<div class="task-buttons">
         <span class="button" onclick="editTaskOpen('`+task.id+`')">Edit</span>
         <span class="button" onclick="deleteTask('`+task.id+`')">Delete</span>
      </div>
   </div>
  </div>`;

  return code;
}

function addTask()
{
  let t = new task();
  let title = document.getElementById('form-task-title').value.trim();
  t.title = title;
  if(t.title=='')
  {
    alert("Title cannot be empty");
    return;
  }
  let content = document.getElementById('form-task-content').value.trim();
  if(content != '')
  {
    t.content = content;
  }
  let dueDate = document.getElementById('form-task-date').value.trim();
  if(dueDate != '')
  {
    t.dueDate = dueDate;
  }
  let dueTime = document.getElementById('form-task-time').value.trim();
  if(dueTime != '')
  {
    t.dueTime = dueTime;
  }
  
  t.topPriority = document.getElementById('form-task-priority').checked;
  t.completed = document.getElementById('form-task-completed').checked;
  let completionPercent = document.getElementById('form-task-percentage').value.trim();
  if(completionPercent != '')
  {
    t.completionPercent = completionPercent;
  }

  tasks.tasks.push(t);
  tasks.mtime = new Date().getTime();
  showTasks();
  renderTasks();
  renderToday(todayFilter);
  saveToLocalByFile('tasks');
  clearAddTaskForm();
}

function updateTask()
{
  let t = new task();

  let id = document.getElementById('form-task-edit-id').value.trim();
  t.id=id;
  let title = document.getElementById('form-task-edit-title').value.trim();
  t.title = title;
  if(t.title=='')
  {
    alert("Title cannot be empty");
    return;
  }
  let content = document.getElementById('form-task-edit-content').value.trim();
  if(content != '')
  {
    t.content = content;
  }
  let dueDate = document.getElementById('form-task-edit-date').value.trim();
  if(dueDate != '')
  {
    t.dueDate = dueDate;
  }
  let dueTime = document.getElementById('form-task-edit-time').value.trim();
  if(dueTime != '')
  {
    t.dueTime = dueTime;
  }
  
  t.topPriority = document.getElementById('form-task-edit-priority').checked;
  t.completed = document.getElementById('form-task-edit-completed').checked;
  
  let completionPercent = document.getElementById('form-task-edit-percentage').value.trim();
  if(completionPercent != '')
  {
    t.completionPercent = completionPercent;
  }

  overwriteTask(id, t);
  tasks.mtime = new Date().getTime();
  showTasks();
  renderTasks();
  renderToday(todayFilter);
  saveToLocalByFile('tasks');
  clearAddTaskForm();
}

function overwriteTask(id, task)
{
  for (var i = 0; i < tasks.tasks.length; i++) {
    // console.log("Comparing "+id+" with "+ta)
    if(tasks.tasks[i].id == id)
    {
      task.creationTime = tasks.tasks[i].creationTime;
      tasks.tasks[i] = task;
    }
  }
}


function deleteTask(id)
{
  for (var i = 0; i < tasks.tasks.length; i++) {
    // console.log("Comparing "+id+" with "+ta)
    if(tasks.tasks[i].id == id)
    {
      tasks.tasks.splice(i, 1);
      break;
    }
  }
  remove('div[data-id="'+id+'"].task');
  tasks.mtime = new Date().getTime();
  saveToLocalByFile('tasks');
}

function completeTask(id)
{
  for (var i = 0; i < tasks.tasks.length; i++) {
    // console.log("Comparing "+id+" with "+ta)
    if(tasks.tasks[i].id == id)
    {
      tasks.tasks[i].completed=true;
      break;
    }
  }
  remove('div[data-id="'+id+'"].task');
  tasks.mtime = new Date().getTime();
  saveToLocalByFile('tasks');
  renderTasks();
  renderToday(todayFilter);
}

function sortTasksByDate(t)
{
  t.sort(function(a,b){

      if(a.dueDate && b.dueDate)
      {
        return a.dueDate.localeCompare(b.dueDate);
      }
      else if (!a.dueDate && b.dueDate)
      {
        return 1;
      }
      else if (a.dueDate && !b.dueDate)
      {
        return -1;
      }

      return 0;
    });

  return t;
}


function getTopPriorityTasks(t)
{
  let r=[]
  for (var i = 0; i < t.length; i++) {
    if(t[i].topPriority)
    {
      r.push(t[i]);
    }
    
  }

  return r;
}

function getNormalPriorityTasks(t)
{
  let r=[]
  for (var i = 0; i < t.length; i++) {
    if(!t[i].topPriority)
    {
      r.push(t[i]);
    }
    
  }

  return r;
}

function renderTasks()
{ 
  let code = ``;
  let completed = ``;
  let t = Array.from(tasks.tasks);

  if(sortTasks=='date')
  {   
    let dueDateSortedTasks = sortTasksByDate(t);
     for (var i = 0; i < dueDateSortedTasks.length; i++) {
    if(!dueDateSortedTasks[i].completed)
    {
      code+=generateTaskHTML(dueDateSortedTasks[i]);
    }
    else
    {
      completed+=generateTaskHTML(dueDateSortedTasks[i]);
    }
    }
  }
  else if(sortTasks=='priority')
  {
    topPriorityTasks = getTopPriorityTasks(t);
    normalPriorityTasks = getNormalPriorityTasks(t);
    for (var i = 0; i < topPriorityTasks.length; i++) {
    if(!topPriorityTasks[i].completed)
    {
      code+=generateTaskHTML(topPriorityTasks[i]);
    }
    else
    {
      completed+=generateTaskHTML(topPriorityTasks[i]);
    }
    }

    for (var i = 0; i < normalPriorityTasks.length; i++) {
    if(!normalPriorityTasks[i].completed)
    {
      code+=generateTaskHTML(normalPriorityTasks[i]);
    }
    else
    {
      completed+=generateTaskHTML(normalPriorityTasks[i]);
    }
    }
  }
  else
  {
    for (var i = 0; i < tasks.tasks.length; i++) {
    if(!tasks.tasks[i].completed)
    {
      code+=generateTaskHTML(tasks.tasks[i]);
    }
    else
    {
      completed+=generateTaskHTML(tasks.tasks[i]);
    }
    }
  }

  document.getElementById('tasks-container').innerHTML = code;
  document.getElementById('completed-tasks-container').innerHTML = completed;

}

function clearAddTaskForm()
{
  document.querySelectorAll("#module-add-tasks input, #module-add-tasks textarea").forEach(function(e){
    e.value ='';
  });

  document.querySelectorAll("#module-add-tasks input[type=checkbox]").forEach(function(e){
    e.checked = false;
  });
}

function deleteCompletedTasks()
{
  for (var i = 0; i < tasks.tasks.length; i++) {
    // console.log("Comparing "+id+" with "+ta)
    if(tasks.tasks[i].completed == true)
    {
      let id = tasks.tasks[i].id;
      tasks.tasks.splice(i, 1);
      remove('div[data-id="'+id+'"].task');
      i=i-1;
    }
  }
  
  tasks.mtime = new Date().getTime();
  saveToLocalByFile('tasks');
}

function toggleCompleted()
{
  toggle('#module-tasks');
  toggle('#module-completed-tasks');
  toggle('#module-events');
  toggle('#module-completed-events');
}

function openSettings()
{
  if(conf.username)
  {
     document.getElementById('username').value=conf.username;
  }
  
  if(password)
  {
    document.getElementById('password').value=password;
  }
  
  document.getElementById('settings-dialog').showModal();
}

function saveSettings()
{

  let username=document.getElementById('username').value.trim();
  if(username!="")
  {
    conf.username=username;
  }
  let p=document.getElementById('password').value.trim();
  if(p!="")
  {
    password=p;
    localStorage.setItem(localstorage_prefix+'password', password);
  }
  saveToLocalByFile('conf');
  closeDialog('settings-dialog');

  if(conf.username)
  {
    document.getElementById('app-username').innerHTML=conf.username;
  }
  else
  {
    document.getElementById('app-username').innerHTML="User";
  }

  conf.mtime = new Date().getTime();
}

function openPassword()
{ 
  if(password)
  {
    document.getElementById('password').value=password;
  }
  
  document.getElementById('password-dialog').showModal();
}

function savePassword()
{

  let p=document.getElementById('password').value.trim();
  if(p!="")
  {
    password=p;
    localStorage.setItem(localstorage_prefix+'password', password);
  }
  saveToLocalByFile('conf');
  closeDialog('password-dialog');
}

/* For events */
function showEvents()
{
  document.querySelectorAll('#col-two .module').forEach(function(e){
    e.style.display = "none";
  })
  document.getElementById('module-events').style.display = "block";
}

function addEventOpen()
{
  document.querySelectorAll('#col-two .module').forEach(function(e){
    e.style.display = "none";
  })
  document.getElementById('module-add-events').style.display = "block";
}

function editEventOpen(id)
{
  document.querySelectorAll('#col-two .module').forEach(function(e){
    e.style.display = "none";
  })
  document.getElementById('module-edit-events').style.display = "block";

  t = getEvent(id);

  if(!t.content)
  {
    t.content='';
  }

  if(!t.venue)
  {
    t.venue='';
  }

  document.getElementById('form-event-edit-id').value = id;
  document.getElementById('form-event-edit-title').value = t.title;
  document.getElementById('form-event-edit-content').value = t.content;
  document.getElementById('form-event-edit-venue').value = t.venue;
  document.getElementById('form-event-edit-date').value = t.dueDate;
  document.getElementById('form-event-edit-time').value = t.dueTime;

}


function toggleEventDetails(id) {
  toggle("div[data-id='"+id+"'] .event-details")
}

function generateEventHTML(event)
{

  let code=`
  <div class="event" data-id="`+event.id+`">
    <div class="event-head">
   <div class="title" onclick="toggleEventDetails('`+event.id+`')">`+event.title+`</div>
   <div class="event-options">`;
   if(event.dueDate)
   {
    code+=`<span class="event-date">`+formatDate(event.dueDate)+`</span>`;
   }
  code+=`
   </div>
   </div>
   <div class="event-details" style="display:none;">`;

   if(event.venue)
   {
    code+=`<div class="event-venue">Venue: `+event.venue+`</div>`;
   }

   if(event.content)
   {
    code+=`<div class="event-content">`+markdownToHtml(event.content)+`</div>`;
   }

   if(event.dueDate)
   {
     code+=`<div class="event-date-time">
     <span class="event-date">`+formatDate(event.dueDate)+`</span>`;
     if(event.dueTime)
      { code+=`<span class="event-time">`+convertTo12HourFormat(event.dueTime)+`</span>`;}
      code+=`</div>`;
   }
      
    code+=`<div class="event-buttons">
         <span class="button" onclick="editEventOpen('`+event.id+`')">Edit</span>
         <span class="button" onclick="deleteEvent('`+event.id+`')">Delete</span>
      </div>
   </div>
  </div>`;

  return code;
}

function addEvent()
{
  let t = new event();
  let title = document.getElementById('form-event-title').value.trim();
  t.title = title;
  if(t.title=='')
  {
    alert("Title cannot be empty");
    return;
  }
  let venue = document.getElementById('form-event-venue').value.trim();
  if(venue != '')
  {
    t.venue = venue;
  }
  let content = document.getElementById('form-event-content').value.trim();
  if(content != '')
  {
    t.content = content;
  }
  let dueDate = document.getElementById('form-event-date').value.trim();
  if(dueDate != '')
  {
    t.dueDate = dueDate;
  }
  let dueTime = document.getElementById('form-event-time').value.trim();
  if(dueTime != '')
  {
    t.dueTime = dueTime;
  }

  events.events.push(t);
  events.events.sort(function(a, b) {
    if(b.dueDate && a.dueDate)
    {
      if(b.dueDate == a.dueDate)
      {
        if(b.dueTime && a.dueTime)
        {
          return compareTime(a.dueTime, b.dueTime);
        }
        else if (!b.dueTime && a.dueTime)
        {
          return -1;
        }
        else if (b.dueTime && !a.dueTime)
        {
          return 1;
        }
      }
      return a.dueDate.localeCompare(b.dueDate);
    }
    else
    {
      return 0;
    }
    
    });
  events.mtime = new Date().getTime();
  showEvents();
  renderEvents();
  renderToday(todayFilter);
  saveToLocalByFile('events');
  clearAddEventForm();
}

function updateEvent()
{
  let t = new event();

  let id = document.getElementById('form-event-edit-id').value.trim();
  t.id=id;
  let title = document.getElementById('form-event-edit-title').value.trim();
  t.title = title;
  if(t.title=='')
  {
    alert("Title cannot be empty");
    return;
  }
  let venue = document.getElementById('form-event-edit-venue').value.trim();
  if(venue != '')
  {
    t.venue = venue;
  }
  let content = document.getElementById('form-event-edit-content').value.trim();
  if(content != '')
  {
    t.content = content;
  }
  let dueDate = document.getElementById('form-event-edit-date').value.trim();
  if(dueDate != '')
  {
    t.dueDate = dueDate;
  }
  let dueTime = document.getElementById('form-event-edit-time').value.trim();
  if(dueTime != '')
  {
    t.dueTime = dueTime;
  }
  
  overwriteEvent(id, t);
  events.events.sort(function(a, b) {
  if(b.dueDate && a.dueDate)
  {
    return b.dueDate - b.dueDate;
  }
  else
  {
    return 0;
  }
  
  });
  events.mtime = new Date().getTime();
  showEvents();
  renderEvents();
  renderToday(todayFilter);
  saveToLocalByFile('events');
  clearAddEventForm();
}

function overwriteEvent(id, event)
{
  for (var i = 0; i < events.events.length; i++) {
    // console.log("Comparing "+id+" with "+ta)
    if(events.events[i].id == id)
    {
      event.creationTime = events.events[i].creationTime;
      events.events[i] = event;
    }
  }
}


function deleteEvent(id)
{
  for (var i = 0; i < events.events.length; i++) {
    // console.log("Comparing "+id+" with "+ta)
    if(events.events[i].id == id)
    {
      events.events.splice(i, 1);
      break;
    }
  }
  remove('div[data-id="'+id+'"].event');
  events.mtime = new Date().getTime();
  saveToLocalByFile('events');
}

function renderEvents()
{ 
  let code = ``;
  let completed = ``;
  let todayDate = new Date().toISOString().substr(0,10);
  for (var i = 0; i < events.events.length; i++) {
    
    if(events.events[i].dueDate < todayDate)
    {
      completed+=generateEventHTML(events.events[i]);
    }
    else
    {
      code+=generateEventHTML(events.events[i]);
    }
  }
  
  document.getElementById('events-container').innerHTML = code;
  document.getElementById('completed-events-container').innerHTML = completed;
}

function clearAddEventForm()
{
  document.querySelectorAll("#module-add-events input, #module-add-events textarea").forEach(function(e){
    e.value ='';
  });

  document.querySelectorAll("#module-add-events input[type=checkbox]").forEach(function(e){
    e.checked = false;
  });
}

function deleteCompletedEvents()
{
  let todayDate = new Date().toISOString().substr(0,10);
  for (var i = 0; i < events.events.length; i++) {
    // console.log("Comparing "+id+" with "+ta)
    if(events.events[i].dueDate < todayDate)
    {
      let id = events.events[i].id;
      events.events.splice(i, 1);
      remove('div[data-id="'+id+'"].event');
      i=i-1;
    }
  }
  
  events.mtime = new Date().getTime();
  saveToLocalByFile('events');
}

function parseToday()
{
  tasksToday = [];
  eventsToday = [];

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const localeDateString = `${year}-${month}-${day}`;
  let todayDate = localeDateString;
  
  for (var i = 0; i < tasks.tasks.length; i++) {
    if(tasks.tasks[i].dueDate == todayDate)
    {
      tasksToday.push(tasks.tasks[i]);
    }
  }

  for (var i = 0; i < events.events.length; i++) {
    if(events.events[i].dueDate == todayDate)
    {
      eventsToday.push(events.events[i]);
    }
  }
}

function renderToday(arg)
{
  todayFilter = arg;
  parseToday();
  
  let code=``;

  let topPriorityTasks = getTopPriorityTasks(tasksToday);
  let normalPriorityTasks = getNormalPriorityTasks(tasksToday);

  if(arg=='all')
  {
    for (var i = 0; i < topPriorityTasks.length; i++) {
      code+=generateTaskHTML(topPriorityTasks[i]);
    }
    for (var i = 0; i < normalPriorityTasks.length; i++) {
      code+=generateTaskHTML(normalPriorityTasks[i]);
    }
    for (var i = 0; i < eventsToday.length; i++) {
      code+=generateEventHTML(eventsToday[i]);
    }
  }
  else if(arg=='tasks')
  {
    for (var i = 0; i < topPriorityTasks.length; i++) {
      code+=generateTaskHTML(topPriorityTasks[i]);
    }
    for (var i = 0; i < normalPriorityTasks.length; i++) {
      code+=generateTaskHTML(normalPriorityTasks[i]);
    }
  }
  else if(arg=='events')
  {
    for (var i = 0; i < eventsToday.length; i++) {
      code+=generateEventHTML(eventsToday[i]);
    }
  }

  document.getElementById('today-container').innerHTML = code;

}

function mobileLoad(a)
{
  document.querySelectorAll(".column").forEach(function(e){
    e.style.display = 'none';
  });

  if(a=='tasks')
  {
    document.getElementById('col-one').style.display='block';
  }
  if(a=='events')
  {
    document.getElementById('col-two').style.display='block';
  }
  if(a=='today')
  {
    document.getElementById('col-three').style.display='flex';
  }
}

function markdownToHtml(markdown) {
    return parseMarkdown(markdown);
}


/***   Regex Markdown Parser by chalarangelo   ***/
// Replaces 'regex' with 'replacement' in 'str'
// Curry function, usage: replaceRegex(regexVar, replacementVar) (strVar)
const replaceRegex = function(regex, replacement){
  return function(str){
    return str.replace(regex, replacement);
  }
}
// Regular expressions for Markdown (a bit strict, but they work)
const codeBlockRegex = /((\n\t)(.*))+/g;
const inlineCodeRegex = /(`)(.*?)\1/g;
const imageRegex = /!\[([^\[]+)\]\(([^\)]+)\)/g;
const linkRegex = /\[([^\[]+)\]\(([^\)]+)\)/g;
const headingRegex = /\n(#+\s*)(.*)/g;
const boldItalicsRegex = /(\*{1,2})(.*?)\1/g;
const strikethroughRegex = /(\~\~)(.*?)\1/g;
const blockquoteRegex = /\n(&gt;|\>)(.*)/g;
const horizontalRuleRegex = /\n((\-{3,})|(={3,}))/g;
const unorderedListRegex = /(\n\s*(\-|\+)\s.*)+/g;
const orderedListRegex = /(\n\s*([0-9]+\.)\s.*)+/g;
const paragraphRegex = /\n+(?!<pre>)(?!<h)(?!<ul>)(?!<blockquote)(?!<hr)(?!\t)([^\n]+)\n/g;
// Replacer functions for Markdown
const codeBlockReplacer = function(fullMatch){
  return '\n<pre>' + fullMatch + '</pre>';
}
const inlineCodeReplacer = function(fullMatch, tagStart, tagContents){
  return '<code>' + tagContents + '</code>';
}
const imageReplacer = function(fullMatch, tagTitle, tagURL){
  return '<img src="' + tagURL + '" alt="' + tagTitle + '" />';
}
const linkReplacer = function(fullMatch, tagTitle, tagURL){
  return '<a href="' + tagURL + '">' + tagTitle + '</a>';
}
const headingReplacer = function(fullMatch, tagStart, tagContents){
  return '\n<h' + tagStart.trim().length + '>' + tagContents + '</h' + tagStart.trim().length + '>';
}
const boldItalicsReplacer = function(fullMatch, tagStart, tagContents){
  return '<' + ( (tagStart.trim().length==1)?('em'):('strong') ) + '>'+ tagContents + '</' + ( (tagStart.trim().length==1)?('em'):('strong') ) + '>';
}
const strikethroughReplacer = function(fullMatch, tagStart, tagContents){
  return '<del>' + tagContents + '</del>';
}
const blockquoteReplacer = function(fullMatch, tagStart, tagContents){
  return '\n<blockquote>' + tagContents + '</blockquote>';
}
const horizontalRuleReplacer = function(fullMatch){
  return '\n<hr />';
}
const unorderedListReplacer = function(fullMatch){
  let items = '';
  fullMatch.trim().split('\n').forEach( item => { items += '<li>' + item.substring(2) + '</li>'; } );
  return '\n<ul>' + items + '</ul>';
}
const orderedListReplacer = function(fullMatch){
  let items = '';
  fullMatch.trim().split('\n').forEach( item => { items += '<li>' + item.substring(item.indexOf('.')+2) + '</li>'; } );
  return '\n<ol>' + items + '</ol>';
}
const paragraphReplacer = function(fullMatch, tagContents){
  return '<p>' + tagContents + '</p>';
}
// Rules for Markdown parsing (use in order of appearance for best results)
const replaceCodeBlocks = replaceRegex(codeBlockRegex, codeBlockReplacer);
const replaceInlineCodes = replaceRegex(inlineCodeRegex, inlineCodeReplacer);
const replaceImages = replaceRegex(imageRegex, imageReplacer);
const replaceLinks = replaceRegex(linkRegex, linkReplacer);
const replaceHeadings = replaceRegex(headingRegex, headingReplacer);
const replaceBoldItalics = replaceRegex(boldItalicsRegex, boldItalicsReplacer);
const replaceceStrikethrough = replaceRegex(strikethroughRegex, strikethroughReplacer);
const replaceBlockquotes = replaceRegex(blockquoteRegex, blockquoteReplacer);
const replaceHorizontalRules = replaceRegex(horizontalRuleRegex, horizontalRuleReplacer);
const replaceUnorderedLists = replaceRegex(unorderedListRegex, unorderedListReplacer);
const replaceOrderedLists = replaceRegex(orderedListRegex, orderedListReplacer);
const replaceParagraphs = replaceRegex(paragraphRegex, paragraphReplacer);
// Fix for tab-indexed code blocks
const codeBlockFixRegex = /\n(<pre>)((\n|.)*)(<\/pre>)/g;
const codeBlockFixer = function(fullMatch, tagStart, tagContents, lastMatch, tagEnd){
  let lines = '';
  tagContents.split('\n').forEach( line => { lines += line.substring(1) + '\n'; } );
  return tagStart + lines + tagEnd;
}
const fixCodeBlocks = replaceRegex(codeBlockFixRegex, codeBlockFixer);
// Replacement rule order function for Markdown
// Do not use as-is, prefer parseMarkdown as seen below
const replaceMarkdown = function(str) {
  return replaceParagraphs(replaceOrderedLists(replaceUnorderedLists(
    replaceHorizontalRules(replaceBlockquotes(replaceceStrikethrough(
      replaceBoldItalics(replaceHeadings(replaceLinks(replaceImages(
        replaceInlineCodes(replaceCodeBlocks(str))
      ))))
    )))
  )));
}
// Parser for Markdown (fixes code, adds empty lines around for parsing)
// Usage: parseMarkdown(strVar)
const parseMarkdown = function(str) {
  return fixCodeBlocks(replaceMarkdown('\n' + str + '\n')).trim();
}

function textAreaAdjust(element) {
  element.style.height = "1px";
  element.style.height = (25+element.scrollHeight)+"px";
}