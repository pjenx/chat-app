const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageInput = $messageForm.elements.message
const $messageButton = $messageForm.elements.messageButton
const $locationButton = document.querySelector('#location-button')
const $messages = document.querySelector('#messages')
$messages.style.overflow = 'scroll'
const $sidebar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(
    location.search, 
    { ignoreQueryPrefix: true }
)

const autoScroll = () => {
    // select new message
    const $newMessage = $messages.lastElementChild
    
    // height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //message container height
    const containerHeight = $messages.scrollHeight

    // how far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if ((containerHeight - newMessageHeight) <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// Listeners
socket.on('message', (message) => {
    // console.log(message)
    const html = Mustache.render(messageTemplate, { 
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (message) => {
    // console.log(message)
    const html = Mustache.render(locationTemplate, { 
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room, users
    })
    $sidebar.innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const message = $messageInput.value

    if (!message) {
        return $messageInput.focus()
    }

    //disable form
    $messageButton.disabled = true

    socket.emit('sendMessage', message, (error) => {
        // enable form
        $messageButton.disabled = false
        $messageInput.value = ''
        $messageInput.focus()

        if (error) {
            return console.log(error)
        }
        // console.log('Message Delivered!')
    })
})

$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    $locationButton.disabled = true


    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, () => {
            // console.log('Location Shared!')
            $locationButton.disabled = false
        })
    })
})

// run on page load
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})