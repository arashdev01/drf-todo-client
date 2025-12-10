import { useState, useEffect } from 'react';
import './App.css';

// ----------------------------------------------------
// تنظیمات آدرس پایه API
// مطمئن شوید که این آدرس با آدرسی که جنگو روی آن اجرا می‌شود مطابقت دارد.
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'; 
// ----------------------------------------------------


function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState(null);
    const [statusMessage, setStatusMessage] = useState('لطفاً وارد شوید');

    const handleLoginSuccess = (token) => {
        setAccessToken(token);
        setIsAuthenticated(true);
        setStatusMessage('ورود موفقیت آمیز! خوش آمدید.');
    };

    const handleLogout = () => {
        setAccessToken(null);
        setIsAuthenticated(false);
        setStatusMessage('شما از سیستم خارج شدید.');
    };

    return (
        <div className="app-container">
            <header>
                <h1>مدیریت تسک با DRF و React</h1>
                <div style={{ color: isAuthenticated ? 'green' : 'red', fontWeight: 'bold' }}>
                    وضعیت: {statusMessage}
                </div>
                {isAuthenticated && (
                    <button 
                        onClick={handleLogout} 
                        style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', marginTop: '10px' }}
                    >
                        خروج
                    </button>
                )}
            </header>

            {!isAuthenticated ? (
                // نمایش فرم لاگین در صورت عدم احراز هویت
                <LoginForm 
                    API_BASE_URL={API_BASE_URL} 
                    onLoginSuccess={handleLoginSuccess} 
                    setStatusMessage={setStatusMessage}
                />
            ) : (
                // نمایش داشبورد در صورت احراز هویت موفق
                <TaskDashboard 
                    accessToken={accessToken} 
                    API_BASE_URL={API_BASE_URL} 
                />
            )}
        </div>
    );
}

// ----------------------------------------------------
// کامپوننت فرم لاگین
// ----------------------------------------------------

function LoginForm({ API_BASE_URL, onLoginSuccess, setStatusMessage }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setStatusMessage('در حال اتصال...');

        try {
            const response = await fetch(`${API_BASE_URL}/token/`, { // مسیر صحیح JWT برای دریافت توکن
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                onLoginSuccess(data.access); // ارسال توکن دسترسی (access token) به کامپوننت اصلی
            } else {
                setStatusMessage('ورود ناموفق. نام کاربری یا رمز عبور اشتباه است.');
            }
        } catch (error) {
            console.error('Login Error:', error);
            setStatusMessage('خطا در اتصال به سرور بک‌اند. (آیا جنگو فعال است؟)');
        }
    };

    return (
        <div className="login-form-container">
            <form onSubmit={handleLogin} className="login-form">
                <h3>ورود (Login)</h3>
                <input 
                    type="text" 
                    placeholder="نام کاربری" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="رمز عبور" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit">ورود</button>
            </form>
        </div>
    );
}


// ----------------------------------------------------
// کامپوننت داشبورد تسک
// ----------------------------------------------------

function TaskDashboard({ accessToken, API_BASE_URL }) {
    const [tasks, setTasks] = useState([]); 
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    // ۱. منطق واکشی تسک‌ها (GET Request)
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
    
    // اجرای fetchTasks هنگام بارگذاری کامپوننت
    useEffect(() => {
        fetchTasks();
    }, [accessToken]); 

    // ۲. منطق ایجاد تسک (POST Request)
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

    // ۳. منطق حذف تسک (DELETE Request)
    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('آیا مطمئن هستید که می‌خواهید این تسک را حذف کنید؟')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.status === 204) { // 204 No Content
                alert('تسک با موفقیت حذف شد.');
                fetchTasks(); 
            } else {
                console.error('خطا در حذف تسک:', response.status);
                alert('خطا در حذف تسک.');
            }
        } catch (error) {
            console.error('Delete Task Error:', error);
        }
    };
    
    // ۴. منطق تغییر وضعیت تکمیل (PATCH Request)
    const handleToggleComplete = async (task) => {
        const newCompletedStatus = !task.completed;
        
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${task.id}/`, {
                method: 'PATCH', // برای به‌روزرسانی جزئی
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ completed: newCompletedStatus }) 
            });

            if (response.ok) {
                fetchTasks(); 
            } else {
                alert('خطا در تغییر وضعیت تسک.');
            }
        } catch (error) {
            console.error('Toggle Complete Error:', error);
        }
    };


    return (
        <div style={{ marginTop: '30px', display: 'flex', gap: '20px' }}>
            {/* بخش سمت راست: فرم ایجاد تسک */}
            <div style={{ flex: 1, border: '1px solid #333', padding: '20px', borderRadius: '8px' }}>
                <h3>ایجاد تسک جدید</h3>
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
                    <div 
                        key={task.id} 
                        style={{ 
                            borderBottom: '1px dashed #ddd', 
                            padding: '10px 0', 
                            opacity: task.completed ? 0.6 : 1, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                        }}
                    >
                        <div>
                            <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#555' }}>{task.description}</p>
                            <small style={{ color: task.completed ? 'green' : 'orange' }}>
                                وضعیت: {task.completed ? '✅ تکمیل شده' : '⏳ در حال انجام'}
                            </small>
                        </div>
                        
                        {/* دکمه‌های کنترلی */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {/* دکمه تغییر وضعیت تکمیل شده */}
                            <button 
                                onClick={() => handleToggleComplete(task)}
                                style={{ 
                                    padding: '5px 10px', 
                                    cursor: 'pointer', 
                                    backgroundColor: task.completed ? '#f39c12' : '#2ecc71', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {task.completed ? 'بازگردانی' : 'تکمیل شد'}
                            </button>

                            {/* دکمه حذف */}
                            <button 
                                onClick={() => handleDeleteTask(task.id)}
                                style={{ 
                                    padding: '5px 10px', 
                                    cursor: 'pointer', 
                                    backgroundColor: '#e74c3c', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                حذف
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;