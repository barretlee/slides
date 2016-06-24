/**
 * @description 取自 johnhax 的高桥流简报样式和脚本，略加修改
 * @ref: http://johnhax.net/takahashi/index.js
 */

window.onerror = function() {
  document.write('观赏本 slide 请使用 Chrome 45+ 等支持 ES6 新特性的浏览器')
}

void function() {
'use strict' // for Chrome 47-

if (typeof fetch !== 'function') {
  alert('Sorry, your browser is too low!')
  return
}

let withoutControl = /(\?|&)cc(&|$|#)/.test(window.location.search)
let mdSource = location.search.slice(1)
if(withoutControl) {
  mdSource = mdSource.replace(/&cc|cc&/, '')
}
if(mdSource === 'cc') {
  mdSource = 'demo'
  withoutControl = true
} else {
  mdSource = mdSource ? mdSource : 'demo'
}
takahashi('doc/' + mdSource + '.md')

function takahashi(markdownUrl) {
  fetch(markdownUrl)
    .then(res => res.text())
    .then(parseContent)
    .then(createSlides)
    .then(startPresentation)
}

function parseContent(text) {
  return text.split(/\n{2,}/).map(slideText => slideText.split(/\n/))
}

function createSlides(slides) {
  slides.map(slide => {
    const slideDiv = document.createElement('div')
    slideDiv.className = 'slide'
    document.body.appendChild(slideDiv)
    let container = slideDiv, listType = null
    const listPatterns = {
      '*': /^\*\s+/,
      '-': /^-\s+/,
      '#': /^\d\.\s+/,
    }
    slide.forEach(line => {
      line = line.trim().replace(/^#+\s+/, '')
      if (listType) {
        if (listPatterns[listType].test(line)) {
          line = line.replace(listPatterns[listType], '')
        } else {
          listType = null
          container = slideDiv
        }
      }
      if (!listType) {
        for (const t of Object.keys(listPatterns)) {
          const re = listPatterns[t]
          if (re.test(line)) {
            listType = t
            container = document.createElement(t === '#' ? 'ol' : 'ul')
            container.className = 'line'
            slideDiv.appendChild(container)
            line = line.replace(listPatterns[listType], '')
            break
          }
        }
      }
      const lineDiv = document.createElement(listType ? 'li' : 'div')
      if (!listType) lineDiv.className = 'line'
      if (line.endsWith(',')) {
        line = line.slice(0, -1)
        lineDiv.classList.add('comma')
      }
      const m = /^(!?)\[(.*?)\]\((.*?)\)/.exec(line)
      if (m) {
        if (m[1]) {
          const img = document.createElement('img')
          img.alt = m[2]
          img.src = m[3]
          lineDiv.classList.add('replaced')
          lineDiv.appendChild(img)
        } else {
          const a = document.createElement('a')
          a.textContent = m[2]
          a.href = m[3]
          lineDiv.appendChild(a)
        }
      } else {
        const tokens = line.split(/(`|\*\*|\*|~~)(?=\S)(.*\S)\1/g)
        for (let i = 0; i < tokens.length; ++i) {
          let node
          switch (tokens[i]) {
            case '`': node = document.createElement('code'); break
            case '**': node = document.createElement('strong'); break
            case '*': node = document.createElement('em'); break
            case '~~': node = document.createElement('s'); break
            default: node = document.createTextNode(tokens[i])
          }
          if (node.nodeType === 1) node.appendChild(document.createTextNode(tokens[++i]))
          lineDiv.appendChild(node)
        }
      }
      container.appendChild(lineDiv)
    })
  })
}

function startPresentation() {
  if(!withoutControl) {
    const controls = document.createElement('div')
    controls.classList.add('controls')
    controls.style.position = 'fixed'
    controls.style.bottom = '0'
    controls.style.left = '0'
    controls.style.right = '0'
    controls.style.color = 'gray'
    controls.style.opacity = '0.6'
    controls.innerHTML = '<button class="prev" style="width: 38%; height: 48px">&lt;</button><button class="next" style="width: 61%; height: 48px">&gt;</button>'
    document.body.appendChild(controls)
    controls.addEventListener('click', event => {
      if  (event.target.matches('button.next')) nextSlide()
      else if (event.target.matches('button.prev')) prevSlide()
    })
  }

  initSlide()
  document.querySelector('.loading').style.display = 'none'
  window.onhashchange = initSlide
  window.onpopstate = e => {
    showSlide(parseInt(e.state))
  }
  window.onkeydown = kbEvent => {
    if (kbEvent.key) {
      switch (kbEvent.key) {
        case 'ArrowRight':  case 'ArrowDown': nextSlide();  break
        case 'ArrowLeft': case 'ArrowUp': prevSlide();  break
      }
    } else if (kbEvent.keyIdentifier) {
      switch (kbEvent.keyIdentifier) {
        case 'Right': case 'Down':  nextSlide();  break
        case 'Left':  case 'Up':  prevSlide();  break
      }
    }
  }
}

function initSlide() {
  if (!showSlide(parseInt(location.hash.slice(1)))) showSlide(0)
  pushState()
}

function showSlide(i) {
    const slide = document.querySelectorAll('.slide')[i]
    if (slide) {
      slideIndex = i
      const curr = current()
      if (curr) curr.classList.toggle('current')
      slide.classList.toggle('current')
      adjustCurrentSlide()
      return true
    }
    return false
}

function current() {
  return  document.querySelector('.current.slide')
}

function nextSlide() {
  const curr = current()
  const c = curr.querySelector('.comma')
  if (c) {
    c.classList.remove('comma')
    return
  }
  const next = curr.nextElementSibling
  // console.log(next)
  if (next && next.matches('.slide')) {
    ++slideIndex
    next.classList.toggle('current')
    curr.classList.toggle('current')
    pushState()
    adjustCurrentSlide()
  }
}

function prevSlide() {
  const curr = current()
  const prev = curr.previousElementSibling
  //console.log(prev)
  if (prev) {
    --slideIndex
    curr.classList.toggle('current')
    prev.classList.toggle('current')
    pushState()
    adjustCurrentSlide()
  }
}

let slideIndex
function pushState() {
  history.pushState(slideIndex, '', `#${slideIndex}`)
}

function adjustCurrentSlide() {
  adjustSlide(current(), viewportSize())
}

function viewportSize() {
  const delta = withoutControl ? 0 : 48
  return {width: window.innerWidth, height: window.innerHeight - delta}
}

function printViewportSize() {
  return {width: 1500, height: 900}
}

function isReplacedElement(e) {
  return e.matches('img, canvas, video, embed, iframe, object')
    && e.width != 0 && e.height != 0
}

function adjustSlide(curr, size) {
  curr.style.visibility = 'hidden'
  curr.style.transform = null
  Array.from(curr.childNodes).forEach(e => {
    if (e.classList.contains('replaced')) e.style.width = size.width + 'px'
    else {
      e.style.fontSize = '1rem'
      e.style.fontSize = `${size.width / e.clientWidth / 2}rem`
    }
  })
  const scale = Math.min(size.height / curr.clientHeight, size.width / curr.clientWidth)
  // console.log(window.devicePixelRatio, scale, size, {width: curr.clientWidth, height: curr.clientHeight}, curr.textContent)
  const dx = (size.width - curr.clientWidth * scale) / 2
  const dy = (size.height - curr.clientHeight * scale) / 2
  curr.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`
  curr.style.visibility = null
  //console.log(vh, curr.clientHeight, vh / curr.clientHeight, curr.style.transform)
}

window.onresize = adjustCurrentSlide

matchMedia('print').onchange = mql => {
  if (mql.matches) {
    // console.log(window.devicePixelRatio,
    //  window.innerWidth, window.innerHeight,
    //  window.outerWidth, window.outerHeight,
    //  document.documentElement.clientWidth, document.documentElement.clientHeight,
    //  document.documentElement.offsetWidth, document.documentElement.offsetHeight,
    //  document.body.clientWidth, document.body.clientHeight,
    //  document.body.offsetWidth, document.body.offsetHeight)
    // const pageBox = document.querySelector('#page-box')
    // pageBox.style.width = window.innerWidth + 'px'
    // pageBox.style.height = window.innerHeight + 'px'
    Array.from(document.querySelectorAll('.slide')).forEach(e => adjustSlide(e, printViewportSize()))
  }
}

}()
