import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Meeting {
  id: string
  title: string
  meetLink: string
  scheduledTime?: Date
  isInstant: boolean
  createdAt: Date
}

interface MeetingState {
  meetings: Meeting[]
  loading: boolean
  error: string | null
}

const initialState: MeetingState = {
  meetings: [],
  loading: false,
  error: null
}

const meetingSlice = createSlice({
  name: 'meetings',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    addMeeting: (state, action: PayloadAction<Meeting>) => {
      state.meetings.push(action.payload)
    },
    clearMeetings: (state) => {
      state.meetings = []
    }
  }
})

export const { setLoading, setError, addMeeting, clearMeetings } = meetingSlice.actions

export const store = configureStore({
  reducer: {
    meetings: meetingSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['meetings/addMeeting'],
        ignoredPaths: ['meetings.meetings']
      }
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch