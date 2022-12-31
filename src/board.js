// Copyright 2002-2009 Huub van de Wetering + Wieger Wesselink, http://10x10.org
document.onkeydown = KeyDown
const bgcolor = 'oldlace'
const fgcolor = '#B1ACA1'
let currentState = 0
const delay = 1400
let timer = null
let state2link = []
let states = []
let board = undefined
let first = undefined
let last = undefined

function SetState(s)
{
  if (board)
  {
    board.setPosition(s);
  }
  else
  {
    console.log('no board!');
  }
}

function HighLiteMove(n)
{
  let N = state2link.length
  if (0 <= currentState && currentState < N)
  {
    const oldlink = state2link[currentState]
    document.links[oldlink].style.backgroundColor = bgcolor
  }
  if (0 <= n && n < N)
  {
    const newlink = state2link[n]
    document.links[newlink].style.backgroundColor = fgcolor
    currentState = n
  }
}

function KeyDown(e)
{
  key = e.which;
                   
  if (key === 37 || key === 100 || key === 188)
  {
    Back(1);
  }
  if (key === 39 || key === 102 || key === 190)
  {
    Forward(1);
  }
}

function Back(step)
{
  GoTo(currentState - step);
}

function Forward(step)
{
  GoTo(first + currentState + step);
}

function GoTo(n)
{
  if (n < first)
  {
    n = first
  }
  if (n >= last)
  {
    n = last - 1
  }
  HighLiteMove(n - first)
  SetState(states[n])
}

function GoStart()
{
  GoTo(first);
}

function GoEnd()
{
  GoTo(last - 1);
}

function Astop()
{
  clearInterval(timer);
  timer = null;
}

function Astart()
{
  if (timer == null)
  {
    timer = setInterval('AutoMove()', delay);
    AutoMove();
  }
  else
  {
    Astop();
  }
}

function AutoMove() 
{
  Forward(1)
}

function Init()
{
  let index = 0
  state2link = []
  for (i = 0; i < document.links.length; i++)
  {
    let h = document.links[i].href.toLowerCase()
    if (h.length >= 15 && h.substring(0, 15) === 'javascript:goto')
    {
      state2link[index] = i
      index = index + 1
    }
  }
  first = 0
  last = states.length
}

function SetBoard(b)
{
  board = b;
}
