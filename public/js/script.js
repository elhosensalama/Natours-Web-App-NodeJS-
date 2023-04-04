/* eslint-disable */

// TODO map

const mapContainer = document.getElementById('map');

if (mapContainer) {
    const locations = JSON.parse(mapContainer.getAttribute('data-locations'));
    console.log(locations);
    mapboxgl.accessToken = 'pk.eyJ1IjoiZWxob3NlbiIsImEiOiJjbGIzbzZtc28wMDVvM3FvYWlpc3QybHIwIn0.RuO1VnDUN5enZV6zKzLDuA';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        scrollZoom: false
        // center: [lng, lnt],
        // zoom: 4,
        // interactive: false
    });

    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(loc => {
        // Add marker
        const el = document.createElement('div');
        el.className = 'marker';

        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // Add popup
        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day} ${loc.description}</p>`)
            .addTo(map);

        bounds.extend(loc.coordinates);
    });
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}

// TODO Alerts

const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
};

// type = success or error
const showAlert = (type, message) => {
    hideAlert();
    const html = `
        <div class="alert alert--${type}">${message}</div>
    `;
    document.querySelector('body').insertAdjacentHTML('afterbegin', html);
    setTimeout(hideAlert, 5000);
};

// TODO Login

const loginForm = document.getElementById('login__form');

const login = async (email, password) => {
    try {
        const { data } = await axios({
            method: 'POST',
            url: 'http://127.0.0.1:8000/api/v1/users/login',
            data: {
                email,
                password
            }
        });
        if (data.status === 'success') {
            showAlert('success', 'Logged in successfuly!');
            setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

// TODO Logout

const logout = async () => {
    try {
        const { data } = await axios({
            method: 'GET',
            url: 'http://127.0.0.1:8000/api/v1/users/logout'
        });
        if (data.status === 'success') {
            showAlert('success', 'Logged out successfuly!');
            setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

const logoutBtn = document.querySelector('.nav__el--logout');

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// TODO Update Settings

const updateAccount = async (name, email) => {
    try {
        const { data } = await axios({
            method: 'PATCH',
            url: 'http://127.0.0.1:8000/api/v1/users/updateMe',
            data: {
                name,
                email
            }
        });
        if (data.status === 'success') {
            showAlert('success', 'Account Updated successfuly!');
            setTimeout(() => {
                location.assign('/account');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

const userDataForm = document.querySelector('.form-user-data');

if (userDataForm) {
    userDataForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        updateAccount(name, email);
    });
}

const updatePassword = async (current, newPassword, passwordConfirm) => {
    try {
        const { data } = await axios({
            method: 'PATCH',
            url: 'http://127.0.0.1:8000/api/v1/users/updateMyPassword',
            data: {
                currentPassword: current,
                password: newPassword,
                passwordConfirm: passwordConfirm
            }
        });
        if (data.status === 'success') {
            showAlert('success', 'Password Updated successfuly!');
            setTimeout(() => {
                location.assign('/account');
            }, 1500);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
};

const userSettingsForm = document.querySelector('.form-user-settings');

if (userSettingsForm) {
    userSettingsForm.addEventListener('submit', e => {
        e.preventDefault();
        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        updatePassword(passwordCurrent, password, passwordConfirm);
    });
}
