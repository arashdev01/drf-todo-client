import React, { useState, useEffect } from 'react';
import './App.css'; 

// تعریف کامپوننت اصلی (App Component)
export default function App() {
  
  // ۱. حالت برای نگهداری توکن JWT
  const [accessToken, setAccessToken] = useState(null); 
  
  // ۲. حالت برای نمایش پیام‌ها
  const [message, setMessage] = useState('لطفاً وارد شوید.');

  // تعریف آدرس پایه API
  const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

  // --- منطق ورود (Login) ---
  const handleLogin = async (username, password) => {
    setMessage('در حال اتصال...');
    try {
      const response = await fetch(`${API_BASE_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        setAccessToken(data.access); 
        setMessage(`ورود موفقیت آمیز! خوش آمدید.`);
      } else {
        setMessage(`خطا در ورود: نام کاربری یا رمز عبور اشتباه است.`);
      }
    } catch (error) {
      setMessage('خطا در اتصال به سرور بک‌اند. (آیا جنگو فعال است؟)');
    }
  };
  
  // منطق خروج
  const handleLogout = () => {
    setAccessToken(null);
    setMessage('شما از حساب خارج شدید.');
  };

  return (
    <div className="App" style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>مدیریت تسک با DRF و React</h1>
      <p style={{ color: accessToken ? 'green' : 'red', fontWeight: 'bold' }}>وضعیت: {message}</p>
      
      {accessToken ? (
        <>
          <button onClick={handleLogout} style={{ float: 'right', padding: '10px' }}>خروج</button>
          <TaskDashboard accessToken={accessToken} API_BASE_URL={API_BASE_URL} />
        </>
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}

// --- کامپوننت‌های فرعی باید خارج از کامپوننت App تعریف شوند ---

// کامپوننت فرم ورود
function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('testuser'); 
  const [password, setPassword] = useState('1234');    

  const handleSubmit = (e) => {
    e.preventDefault(); 
    onLogin(username, password);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', maxWidth: '400px', margin: '20px auto' }}>
      <h3>ورود (Login)</h3>
      <form onSubmit={handleSubmit}>
        {/* ... (کدهای input) ... */}
        <input 
          type="text" 
          placeholder="نام کاربری" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          style={{ padding: '10px', margin: '5px 0', width: '100%', boxSizing: 'border-box' }}
          required 
        />
        <input 
          type="password" 
          placeholder="رمز عبور" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: '10px', margin: '5px 0', width: '100%', boxSizing: 'border-box' }}
          required 
        />
        <button type="submit" style={{ padding: '10px', margin: '10px 0', width: '100%', cursor: 'pointer' }}>ورود</button>
      </form>
    </div>
  );
}

// کامپوننت داشبورد تسک
function TaskDashboard({ accessToken, API_BASE_URL }) {
    const [tasks, setTasks] = useState([]); 
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`, 
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTasks(data); 
            } else {
                console.error("خطا در واکشی تسک‌ها:", response.status);
            }
        } catch (error) {
            console.error('Task Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchTasks();
    }, [accessToken]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ title, description, completed: false }) 
            });

            if (response.status === 201) {
                alert('تسک با موفقیت ایجاد شد.');
                setTitle('');
                setDescription('');
                fetchTasks(); 
            } else {
                 const errorData = await response.json();
                 alert('ایجاد تسک ناموفق: ' + JSON.stringify(errorData));
            }

        } catch (error) {
            console.error('Create Task Error:', error);
        }
    };

    return (
        <div style={{ marginTop: '30px', display: 'flex', gap: '20px' }}>
            {/* بخش سمت راست: فرم ایجاد تسک */}
            <div style={{ flex: 1, border: '1px solid #333', padding: '20px', borderRadius: '8px' }}>
                <h3>ایجاد تسک جدید</h3>
                {/* ... (کدهای فرم) ... */}
                <form onSubmit={handleCreateTask}>
                    <input 
                        type="text" 
                        placeholder="عنوان" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        style={{ padding: '10px', margin: '5px 0', width: '100%', boxSizing: 'border-box' }}
                        required 
                    />
                    <textarea 
                        placeholder="توضیحات" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        style={{ padding: '10px', margin: '5px 0', width: '100%', minHeight: '80px', boxSizing: 'border-box' }}
                    />
                    <button type="submit" style={{ padding: '10px', margin: '10px 0', width: '100%', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>ایجاد تسک</button>
                </form>
            </div>

            {/* بخش سمت چپ: لیست تسک‌ها */}
            <div style={{ flex: 1, border: '1px solid #333', padding: '20px', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                <h3>لیست تسک‌های شما ({tasks.length})</h3>
                {loading && <p>در حال بارگذاری...</p>}
                
                {!loading && tasks.length === 0 && <p>تسک فعالی یافت نشد.</p>}

                {!loading && tasks.map(task => (
                    <div key={task.id} style={{ borderBottom: '1px dashed #ddd', padding: '10px 0', opacity: task.completed ? 0.6 : 1 }}>
                        <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#555' }}>{task.description}</p>
                        <small style={{ color: task.completed ? 'green' : 'orange' }}>
                            وضعیت: {task.completed ? '✅ تکمیل شده' : '⏳ در حال انجام'}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
}