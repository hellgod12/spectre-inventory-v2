*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:Arial,sans-serif;
}

body{
background:#0f0f0f;
color:white;
display:flex;
min-height:100vh;
}

.sidebar{
width:250px;
background:#171717;
padding:30px;
border-right:1px solid #2a2a2a;
}

.sidebar h2{
margin-bottom:30px;
font-size:28px;
}

.sidebar ul{
list-style:none;
}

.sidebar li{
padding:15px;
margin-bottom:10px;
background:#222;
border-radius:10px;
cursor:pointer;
}

.sidebar li:hover{
background:#333;
}

.main{
flex:1;
padding:30px;
}

.header{
margin-bottom:30px;
}

.cards{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
gap:20px;
}

.card{
background:#1b1b1b;
padding:25px;
border-radius:15px;
border:1px solid #2a2a2a;
}

.card h3{
font-size:16px;
color:#aaa;
margin-bottom:10px;
}

.card span{
font-size:32px;
font-weight:bold;
}

@media(max-width:768px){

body{
flex-direction:column;
}

.sidebar{
width:100%;
}

}
