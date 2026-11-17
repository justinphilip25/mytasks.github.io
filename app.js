const apps=[
{id:1,name:"FocusFlow",icon:"◉",category:"Productivity",rating:4.9,desc:"Stay focused and organize your daily tasks."},
{id:2,name:"Pixel Studio",icon:"✿",category:"Creative",rating:4.8,desc:"Create sketches and beautiful artwork."},
{id:3,name:"Orbit Run",icon:"✦",category:"Games",rating:4.9,desc:"Explore colorful worlds in this arcade game."},
{id:4,name:"Daily Words",icon:"Aa",category:"Learning",rating:4.6,desc:"Improve your vocabulary every day."},
{id:5,name:"Budget Bloom",icon:"❋",category:"Productivity",rating:4.8,desc:"Manage your budget and expenses."},
{id:6,name:"Little Garden",icon:"❀",category:"Games",rating:4.7,desc:"Build and grow your own little garden."},
{id:7,name:"Moodboard",icon:"▧",category:"Creative",rating:4.5,desc:"Collect your creative inspiration."},
{id:8,name:"SpeakEasy",icon:"◖",category:"Learning",rating:4.8,desc:"Practice languages through conversations."}
];
let category="All",view="all";
let saved=JSON.parse(localStorage.getItem("savedApps")||"[]");

function show(v){view=v;render()}
function render(){
const query=document.getElementById("search").value.toLowerCase();
const list=apps.filter(a=>
(category==="All"||a.category===category)&&
(view==="all"||(view==="apps"&&a.category!=="Games")||(view==="games"&&a.category==="Games")||(view==="saved"&&saved.includes(a.id)))&&
(a.name+" "+a.category+" "+a.desc).toLowerCase().includes(query)
);
document.getElementById("heading").textContent=view==="saved"?"Saved apps":"Explore apps";
document.getElementById("grid").innerHTML=list.map(a=>`
<div class="card">
<div class="icon">${a.icon}</div>
<h3>${a.name}</h3>
<p>${a.category} · ★ ${a.rating}</p>
<p>${a.desc}</p>
<button onclick="toggleSave(${a.id})">${saved.includes(a.id)?"♥ Saved":"♡ Save"}</button>
<button onclick="alert('${a.name}: Add your real download URL here.')">Get</button>
</div>`).join("")||"<p>No apps found.</p>";
}
function toggleSave(id){
saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];
localStorage.setItem("savedApps",JSON.stringify(saved));
render();
}
render();
