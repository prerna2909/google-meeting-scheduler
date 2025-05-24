import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { addMeeting, setLoading, setError } from '../store'
import { format } from 'date-fns'

export default function Home() {
  const { data: session, status } = useSession()
  const dispatch = useDispatch()
  const { meetings, loading, error } = useSelector((state: RootState) => state.meetings)
  
  const [scheduledTitle, setScheduledTitle] = useState('')
  const [scheduledDateTime, setScheduledDateTime] = useState('')

  const createInstantMeeting = async () => {
    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const response = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Instant Meeting',
          isInstant: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create meeting')
      }

      const meetingData = await response.json()
      dispatch(addMeeting(meetingData))
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to create meeting'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const createScheduledMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!scheduledTitle.trim() || !scheduledDateTime) {
      dispatch(setError('Please fill in all fields'))
      return
    }

    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const response = await fetch('/api/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: scheduledTitle,
          scheduledTime: scheduledDateTime,
          isInstant: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create scheduled meeting')
      }

      const meetingData = await response.json()
      dispatch(addMeeting(meetingData))
      setScheduledTitle('')
      setScheduledDateTime('')
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to create meeting'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Meeting link copied to clipboard!')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Meeting Scheduler
            </h1>
            <p className="text-gray-600 mb-6">
              Sign in with Google to create and schedule meetings
            </p>
            <button
              onClick={() => signIn('google')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Meeting Scheduler
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Instant Meeting Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Instant Meeting
            </h2>
            <p className="text-gray-600 mb-6">
              Create a meeting that starts immediately
            </p>
            <button
              onClick={createInstantMeeting}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition duration-200"
            >
              {loading ? 'Creating Meeting...' : 'Create Instant Meeting'}
            </button>
          </div>

          {/* Scheduled Meeting Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Schedule Meeting
            </h2>
            <form onSubmit={createScheduledMeeting}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={scheduledTitle}
                  onChange={(e) => setScheduledTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter meeting title"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="datetime"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition duration-200"
              >
                {loading ? 'Scheduling Meeting...' : 'Schedule Meeting'}
              </button>
            </form>
          </div>
        </div>

        {/* Meetings List */}
        {meetings.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Meetings
            </h2>
            <div className="space-y-4">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {meeting.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      meeting.isInstant 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {meeting.isInstant ? 'Instant' : 'Scheduled'}
                    </span>
                  </div>
                  {meeting.scheduledTime && (
                    <p className="text-gray-600 mb-2">
                      Scheduled for: {format(new Date(meeting.scheduledTime), 'PPp')}
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Join Meeting
                    </a>
                    <button
                      onClick={() => copyToClipboard(meeting.meetLink)}
                      className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}