import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/states/reducer.js'
import usersReducer from '../features/users/states/reducer.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
  },
})

export default store
