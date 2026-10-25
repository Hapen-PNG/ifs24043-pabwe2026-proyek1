import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/states/reducer.js'
import usersReducer from '../features/users/states/reducer.js'
import songsReducer from '../features/songs/states/reducer.js'
import libraryReducer from '../features/library/states/reducer.js'
import activityReducer from '../features/activity/states/reducer.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    songs: songsReducer,
    library: libraryReducer,
    activity: activityReducer,
  },
})

export default store
