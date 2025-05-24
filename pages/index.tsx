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
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <div className="simple-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h1>Meeting Scheduler</h1>
          <p>Sign in with Google to create and schedule meetings</p>
          <button
            onClick={() => signIn('google')}
            className="simple-button primary"
            style={{ width: '100%' }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Simple Header */}
      <div className="simple-header" style={{ backgroundColor: 'white', padding: '15px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Meeting Scheduler</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span>Welcome, {session.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="simple-button"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {error && (
          <div className="simple-alert">
            {error}
          </div>
        )}

        {/* Meeting Creation Grid */}
        <div className="simple-grid">
          {/* Instant Meeting */}
          <div className="simple-card">
            <h2>Instant Meeting</h2>
            <p>Create a meeting that starts immediately</p>
            <button
              onClick={createInstantMeeting}
              disabled={loading}
              className="simple-button success"
              style={{ width: '100%' }}
            >
              {loading ? 'Creating Meeting...' : 'Create Instant Meeting'}
            </button>
          </div>

          {/* Scheduled Meeting */}
          <div className="simple-card">
            <h2>Schedule Meeting</h2>
            <form onSubmit={createScheduledMeeting}>
              <div style={{ marginBottom: '15px' }}>
                <label className="simple-label">Meeting Title</label>
                <input
                  type="text"
                  value={scheduledTitle}
                  onChange={(e) => setScheduledTitle(e.target.value)}
                  className="simple-input"
                  placeholder="Enter meeting title"
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label className="simple-label">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="simple-input"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="simple-button primary"
                style={{ width: '100%' }}
              >
                {loading ? 'Scheduling Meeting...' : 'Schedule Meeting'}
              </button>
            </form>
          </div>
        </div>

        {/* Meetings List */}
        {meetings.length > 0 && (
          <div className="simple-card" style={{ marginTop: '30px' }}>
            <h2>Your Meetings ({meetings.length})</h2>
            {meetings.map((meeting) => (
              <div key={meeting.id} className="meeting-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ margin: '0 0 5px 0' }}>{meeting.title}</h3>
                  <span className={`meeting-badge ${meeting.isInstant ? 'instant' : 'scheduled'}`}>
                    {meeting.isInstant ? 'Instant' : 'Scheduled'}
                  </span>
                </div>
                {meeting.scheduledTime && (
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    Scheduled for: {format(new Date(meeting.scheduledTime), 'PPp')}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <a
                    href={meeting.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="simple-button primary"
                    style={{ textDecoration: 'none' }}
                  >
                    Join Meeting
                  </a>
                  <button
                    onClick={() => copyToClipboard(meeting.meetLink)}
                    className="simple-button"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {meetings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>No meetings yet</h3>
            <p>Create your first meeting using the options above</p>
          </div>
        )}
      </div>
    </div>
  )
}