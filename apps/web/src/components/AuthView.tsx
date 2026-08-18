import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { Role, User } from '../types';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { pullDatabaseFromFirebase } from '../lib/firebaseSync';
import { SimpleCaptcha } from './SimpleCaptcha';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getRedirectResult,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const SUPER_ADMIN_EMAILS = ['kashinathgaikwad305@gmail.com', 'aaratimule006@gmail.com'];
const CLIENT_EMAILS = ['aaratideepak29@gmail.com'];
const EMPLOYEE_EMAILS = ['aarati123@gmail.com', 'kiranm@gmail.com'];
const isOwnerEmail = (email: string) => SUPER_ADMIN_EMAILS.includes((email || '').toLowerCase().trim());
const isClientEmail = (email: string) => CLIENT_EMAILS.includes((email || '').toLowerCase().trim());
const isEmployeeEmail = (email: string) => EMPLOYEE_EMAILS.includes((email || '').toLowerCase().trim());

export const AuthView: React.FC = () => {
  const { loginUser, registerUser, registrationCode } = useDashboardStore();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [role] = useState<Role>('PENDING');

  const [errorMsg, setErrorMsg] = useState('');
  const [errorAction, setErrorAction] = useState<'switch_to_login' | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [showGoogleMock, setShowGoogleMock] = useState(false);
  const [loading, setLoading] = useState(false);

  // Clear cache hook
  useEffect(() => {
    const cacheVersion = localStorage.getItem('app-cache-version');
    if (cacheVersion !== 'v3') {
      console.log('Nuking old Firebase collections and local cache...');
      import('../lib/firebaseSync').then(({ nukeFirebaseAndSeed }) => {
        nukeFirebaseAndSeed().then(() => {
          localStorage.setItem('app-cache-version', 'v3');
          setTimeout(() => window.location.reload(), 1000); // Give it a second to finish
        });
      });
    }
  }, []);

  // Handle Firebase fallback redirect if popup was blocked or browser reloaded
  useEffect(() => {
    if (isFirebaseConfigured && auth) {

      // 1. Listen for any persistent auth state
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && !useDashboardStore.getState().currentUser) {
          const uid = user.uid;
          const firebaseEmail = user.email || '';
          const firebaseName = user.displayName || firebaseEmail.split('@')[0];
          const firebasePhoto = user.photoURL || '';

          const isOwner = isOwnerEmail(firebaseEmail);
          const isClient = isClientEmail(firebaseEmail);
          const isEmployee = isEmployeeEmail(firebaseEmail);
          const defaultRole: Role = isOwner ? 'SUPER_ADMIN' : isClient ? 'CLIENT' : isEmployee ? 'EMPLOYEE' : 'PENDING';
          const defaultPermissions = isOwner ? ['all'] : isClient ? ['read'] : ['work'];

          // Temporarily set minimal user so dashboard appears instantly
          const finalUser: User = {
            id: uid,
            email: firebaseEmail,
            name: firebaseName,
            role: defaultRole,
            permissions: defaultPermissions,
            avatar: firebasePhoto,
          };

          useDashboardStore.getState().setGlobalSuccessMsg('Login session restored.');
          useDashboardStore.setState({ currentUser: finalUser });

          if (db) {
            const userDocRef = doc(db, 'users', uid);
            getDoc(userDocRef).then((userDoc) => {
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const enforcedRole = isOwner ? 'SUPER_ADMIN' : isClient ? 'CLIENT' : isEmployee ? 'EMPLOYEE' : (userData.role || 'PENDING');
                const enforcedPermissions = isOwner ? ['all'] : isClient ? ['read'] : ['work'];

                useDashboardStore.setState({
                  currentUser: {
                    ...finalUser,
                    name: userData.name || firebaseName,
                    role: enforcedRole,
                    permissions: enforcedPermissions,
                    avatar: userData.avatar || firebasePhoto,
                  }
                });

                if ((isOwner && userData.role !== 'SUPER_ADMIN') || (isClient && userData.role !== 'CLIENT') || (isEmployee && userData.role !== 'EMPLOYEE')) {
                  setDoc(userDocRef, { ...userData, role: enforcedRole, permissions: enforcedPermissions }, { merge: true });
                }
              }
            }).catch((err) => {
              if (err.message?.includes('offline')) {
                console.warn('[Auth] Firestore is offline. Continuing with default/local state.');
              } else {
                console.error('[Auth] Profile fetch error:', err);
              }
            });
          }

          pullDatabaseFromFirebase().catch(console.error);
        }
      });

      // 2. Also check redirect result just in case
      getRedirectResult(auth).then(async (userCredential) => {
        if (userCredential && !useDashboardStore.getState().currentUser) {
          const uid = userCredential.user.uid;
          const firebaseEmail = userCredential.user.email || '';
          const firebaseName = userCredential.user.displayName || firebaseEmail.split('@')[0];
          const firebasePhoto = userCredential.user.photoURL || '';

          const finalUser: User = {
            id: uid,
            email: firebaseEmail,
            name: firebaseName,
            role: 'EMPLOYEE', // Safer default
            permissions: ['work'],
            avatar: firebasePhoto,
          };

          // Set user IMMEDIATELY so dashboard appears without waiting for Firestore
          useDashboardStore.getState().setGlobalSuccessMsg('Login successful! Welcome back.');
          useDashboardStore.setState({ currentUser: finalUser });

          // Background Firestore sync (non-blocking)
          const userDocRef = doc(db, 'users', uid);
          getDoc(userDocRef).then(async (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const enrichedUser = {
                ...finalUser,
                name: userData.name || firebaseName,
                role: userData.role || 'EMPLOYEE',
                permissions: userData.permissions || ['work'],
                avatar: userData.avatar || firebasePhoto,
              };
              useDashboardStore.setState({ currentUser: enrichedUser });
              useDashboardStore.getState().addAuditLog('FIREBASE_LOGIN', `User ${enrichedUser.name} logged in via Google Redirect.`);
            } else {
              await setDoc(userDocRef, finalUser);
              useDashboardStore.getState().addAuditLog('FIREBASE_REGISTER', `New user registered via Google Redirect: ${finalUser.name}`);
            }
          }).catch((firestoreError) => {
            console.warn('[Auth] Firestore profile fetch/write failed on redirect.', firestoreError);
          });

          pullDatabaseFromFirebase().catch(console.error);
        }
      }).catch((error) => {
        console.error('[Auth] Redirect result error:', error);
        setErrorMsg(`Google Authentication failed: ${error.message}`);
      });

      return () => unsubscribe();
    }
  }, []);

  // Maps Firebase Auth error codes to friendly messages
  const getFirebaseAuthError = (code: string): { message: string; action?: 'switch_to_login' } => {
    switch (code) {
      case 'auth/email-already-in-use':
        return { message: 'This email is already registered. Please sign in instead.', action: 'switch_to_login' };
      case 'auth/invalid-email':
        return { message: 'The email address is not valid. Please check and try again.' };
      case 'auth/weak-password':
        return { message: 'Password is too weak. Use at least 6 characters.' };
      case 'auth/user-not-found':
        return { message: 'No account found with this email. Please register first.' };
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return { message: 'Incorrect email or password. Please try again.' };
      case 'auth/too-many-requests':
        return { message: 'Too many failed attempts. Please wait a moment and try again.' };
      case 'auth/network-request-failed':
        return { message: 'Network error. Please check your internet connection.' };
      case 'auth/user-disabled':
        return { message: 'This account has been disabled. Contact support.' };
      default:
        return { message: 'Authentication failed. Please try again.' };
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!captchaValid) {
      setErrorMsg('Please complete the security check (CAPTCHA) correctly.');
      return;
    }

    setLoading(true);

    if (isFirebaseConfigured && auth && db) {
      try {
        // Step 1: Firebase Auth — this is the only await we block on
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const firebaseEmail = userCredential.user.email || email;

        // Check role by email
        const isOwner = isOwnerEmail(firebaseEmail);
        const isClient = isClientEmail(firebaseEmail);
        const isEmployee = isEmployeeEmail(firebaseEmail);
        const defaultRole: Role = isOwner ? 'SUPER_ADMIN' : isClient ? 'CLIENT' : isEmployee ? 'EMPLOYEE' : 'PENDING';

        // Step 2: Set a minimal user immediately so the dashboard appears NOW
        const immediateUser: User = {
          id: uid,
          email: firebaseEmail,
          name: name || firebaseEmail.split('@')[0],
          role: defaultRole,
          permissions: isOwner ? ['all'] : ['work'],
        };
        useDashboardStore.getState().setGlobalSuccessMsg('Login successful! Welcome back.');
        useDashboardStore.setState({ currentUser: immediateUser });
        setLoading(false);

        // Step 3: Enrich profile from Firestore in background (non-blocking)
        const userDocRef = doc(db, 'users', uid);
        getDoc(userDocRef).then(async (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const enforcedRole = isOwner ? 'SUPER_ADMIN' : (userData.role || 'PENDING');
            const enrichedUser: User = {
              id: uid,
              email: firebaseEmail,
              name: userData.name || immediateUser.name,
              role: enforcedRole,
              permissions: isOwner ? ['all'] : (userData.permissions || ['work']),
            };

            // Auto-heal role in database if it was wrongly saved as employee
            if (isOwner && userData.role !== 'SUPER_ADMIN') {
              await setDoc(userDocRef, { ...userData, role: 'SUPER_ADMIN', permissions: ['all'] }, { merge: true });
            }

            useDashboardStore.setState({ currentUser: enrichedUser });
            useDashboardStore.getState().addAuditLog('FIREBASE_LOGIN', `User ${enrichedUser.name} logged in via Firebase.`);
          } else {
            // No Firestore doc yet — save one
            await setDoc(userDocRef, {
              name: immediateUser.name,
              email: immediateUser.email,
              role: defaultRole,
              permissions: immediateUser.permissions,
            });
            useDashboardStore.setState((state) => ({
              users: [...state.users.filter(u => u.id !== uid), immediateUser]
            }));
            useDashboardStore.getState().addAuditLog('FIREBASE_LOGIN', `User ${immediateUser.name} logged in (new profile created).`);
          }
          // Pull collection data in background
          pullDatabaseFromFirebase().catch((err) => {
            if (err.message?.includes('offline')) {
              console.warn('[Auth] Firestore is offline. Skipping full sync.');
            } else {
              console.error(err);
            }
          });
        }).catch((err) => {
          if (err.message?.includes('offline')) {
            console.warn('[Auth] Firestore is offline. Continuing with default/local state.');
          } else {
            console.warn('[Auth] Firestore profile fetch error:', err);
          }
        });

      } catch (error: any) {
        // Log as warning — these are handled auth errors (wrong password, no account, etc.)
        console.warn('[Auth] Firebase login error:', error.code, error.message);
        const { message, action } = getFirebaseAuthError(error.code || '');
        setErrorMsg(message);
        setErrorAction(action || null);
        setLoading(false);
      }
    } else {
      // Mock Sandbox Login
      setTimeout(() => {
        const success = loginUser(email);
        setLoading(false);
        if (success) {
          useDashboardStore.getState().setGlobalSuccessMsg('Login successful! Welcome back.');
        } else {
          setErrorMsg('Invalid email address. Please try one of the demo emails or register a new account.');
        }
      }, 800);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setErrorAction(null);
    setSuccessMsg('');

    if (!name || !email || !password || !inputCode) {
      setErrorMsg('Please enter all required fields.');
      return;
    }

    if (inputCode !== registrationCode) {
      setErrorMsg('Invalid Firm Registration Code. Please contact your Super Admin.');
      return;
    }

    if (!captchaValid) {
      setErrorMsg('Please complete the security check (CAPTCHA) correctly.');
      return;
    }

    setLoading(true);

    if (isFirebaseConfigured && auth && db) {
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        const isClient = isClientEmail(email);
        const isEmployee = isEmployeeEmail(email);
        const assignedRole: Role = isClient ? 'CLIENT' : isEmployee ? 'EMPLOYEE' : role;
        const permissions = assignedRole === 'SUPER_ADMIN' ? ['all'] : assignedRole === 'CLIENT' ? ['read'] : ['work'];

        // Save role details to Firestore users collection
        await setDoc(doc(db, 'users', uid), {
          name,
          email,
          role: assignedRole,
          permissions,
        });

        const registeredUser: User = {
          id: uid,
          name,
          email,
          role: assignedRole,
          permissions,
        };

        // Set user in local store and append to users list so Super Admins can see them
        useDashboardStore.setState((state) => ({
          currentUser: registeredUser,
          users: [...state.users.filter(u => u.id !== uid), registeredUser]
        }));
        useDashboardStore.getState().addAuditLog('FIREBASE_REGISTER', `New user registered: ${name} (${role})`);
        setSuccessMsg('Account registered successfully! Welcome.');
        setLoading(false);

        // Pull database in background after login — non-blocking
        pullDatabaseFromFirebase().catch(console.error);
      } catch (error: any) {
        // Log as warning — these are handled auth errors (duplicate email, weak password, etc.)
        console.warn('[Auth] Firebase register error:', error.code, error.message);
        const { message, action } = getFirebaseAuthError(error.code || '');
        setErrorMsg(message);
        setErrorAction(action || null);
        setLoading(false);
      }
    } else {
      // Sandbox Mock registration
      setTimeout(() => {
        registerUser(name, email, role);
        setLoading(false);
        setSuccessMsg('Account registered successfully! Welcome.');
      }, 800);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Password reset link sent! Check your inbox.');
      } catch (error: any) {
        console.error(error);
        setErrorMsg(`Failed to send password reset: ${error.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Mock Sandbox reset email
      setTimeout(() => {
        setLoading(false);
        setSuccessMsg('Reset password link sent successfully! Check your inbox.');
      }, 1200);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg('');
    setErrorAction(null);
    setSuccessMsg('');

    if (authMode === 'register') {
      if (!inputCode) {
        setErrorMsg('Please enter the Firm Registration Code before signing up with Google.');
        return;
      }
      if (inputCode !== registrationCode) {
        setErrorMsg('Invalid Firm Registration Code. Please contact your Super Admin.');
        return;
      }
    }

    setLoading(true);

    if (isFirebaseConfigured && auth && db) {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const uid = userCredential.user.uid;
        const firebaseEmail = userCredential.user.email || '';
        const firebaseName = userCredential.user.displayName || firebaseEmail.split('@')[0];
        const firebasePhoto = userCredential.user.photoURL || '';

        const isOwner = isOwnerEmail(firebaseEmail);
        const isClient = isClientEmail(firebaseEmail);
        const isEmployee = isEmployeeEmail(firebaseEmail);
        const defaultRole: Role = isOwner ? 'SUPER_ADMIN' : isClient ? 'CLIENT' : isEmployee ? 'EMPLOYEE' : 'PENDING';

        const finalUser: User = {
          id: uid,
          email: firebaseEmail,
          name: firebaseName,
          role: defaultRole,
          permissions: isOwner ? ['all'] : ['work'],
          avatar: firebasePhoto,
        };

        // Set user IMMEDIATELY
        useDashboardStore.getState().setGlobalSuccessMsg('Login successful! Welcome back.');
        useDashboardStore.setState({ currentUser: finalUser });

        // Background Firestore sync
        if (db) {
          const userDocRef = doc(db, 'users', uid);
          getDoc(userDocRef).then(async (userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const enforcedRole = isOwner ? 'SUPER_ADMIN' : (userData.role || 'PENDING');

              const enrichedUser = {
                ...finalUser,
                name: userData.name || firebaseName,
                role: enforcedRole,
                permissions: isOwner ? ['all'] : (userData.permissions || ['work']),
                avatar: userData.avatar || firebasePhoto,
              };

              // Auto-heal owner role in DB
              if (isOwner && userData.role !== 'SUPER_ADMIN') {
                await setDoc(userDocRef, { ...userData, role: 'SUPER_ADMIN', permissions: ['all'] }, { merge: true });
              }

              useDashboardStore.setState({ currentUser: enrichedUser });
              useDashboardStore.getState().addAuditLog('FIREBASE_LOGIN', `User ${enrichedUser.name} logged in via Google.`);
            } else {
              // Check if user was pre-registered by an Admin (by email)
              const preRegisteredUser = useDashboardStore.getState().users.find(
                (u) => u.email.toLowerCase() === firebaseEmail.toLowerCase()
              );

              if (preRegisteredUser) {
                const linkedUser = {
                  ...finalUser,
                  name: preRegisteredUser.name || firebaseName,
                  role: preRegisteredUser.role,
                  permissions: preRegisteredUser.permissions,
                };
                await setDoc(userDocRef, linkedUser);

                // Clean up the old pre-registered dummy record if it had a different ID
                if (preRegisteredUser.id !== uid) {
                  useDashboardStore.getState().deleteUser(preRegisteredUser.id);
                }

                useDashboardStore.setState({ currentUser: linkedUser });
                useDashboardStore.getState().addAuditLog('FIREBASE_REGISTER', `Linked pre-registered account via Google: ${linkedUser.name}`);
              } else {
                // Completely new user
                if (authMode === 'login') {
                  // Reject sign-in for unknown users on the login screen to enforce the Registration Code
                  await auth.signOut();
                  useDashboardStore.setState({ currentUser: null });
                  setErrorMsg('Account not found. Please register using your Firm Registration Code.');
                } else {
                  await setDoc(userDocRef, finalUser);
                  useDashboardStore.setState((state) => ({
                    users: [...state.users.filter(u => u.id !== finalUser.id), finalUser]
                  }));
                  useDashboardStore.getState().addAuditLog('FIREBASE_REGISTER', `New user registered via Google: ${finalUser.name}`);
                }
              }
            }
          }).catch((firestoreError) => {
            console.warn('[Auth] Firestore profile fetch/write failed.', firestoreError);
          });
          
          pullDatabaseFromFirebase().catch(console.error);
        }

      } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          console.warn('[Auth] Google Auth error:', error.code, error.message);
          setErrorMsg(`Google Authentication failed: ${error.message}`);
        } else {
          setErrorMsg(`Login was cancelled. Please try again.`);
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Sandbox fallback
      setTimeout(() => {
        setShowGoogleMock(true);
        setLoading(false);
      }, 300);
    }
  };

  const handleMockGoogleLogin = (mockEmail: string, route: string) => {
    setShowGoogleMock(false);
    setLoading(true);
    setTimeout(() => {
      loginUser(mockEmail);
      useDashboardStore.getState().setGlobalSuccessMsg(`Google Sandbox Login successful as ${mockEmail}!`);
      setLoading(false);
      window.location.href = route;
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background">
      {/* Main Container: 2-Column Layout */}
      <div className="max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-premium border border-outline-variant/30 min-h-[640px]">

        {/* Left Column: Visual Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden" style={{ backgroundColor: '#f4f2ff' }}>
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#004ac6 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          ></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white p-1 rounded-xl shadow-md border border-slate-200 shrink-0">
                <img
                  src="/vanntagge-logo.png"
                  alt="VANNTAGGE CFO SERVICES LLP"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <h1 className="text-xl font-extrabold text-on-surface font-outfit tracking-tight">VANNTAGGE</h1>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-on-surface leading-tight font-outfit">
                Secure Financial Intelligence.
              </h2>
              <p className="text-sm text-on-surface-variant max-w-[360px] leading-relaxed">
                Access your executive suite with confidence. Our enterprise-grade security ensures your data remains protected at every touchpoint.
              </p>
            </div>
          </div>

          {/* Active Mode indicator badge */}
          <div className="relative z-10 mt-auto pb-4">
            <div className="w-full rounded-2xl shadow-xl transform rotate-1 bg-white p-6 flex flex-col gap-5 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Workspace Status</span>
                <span className={`px-2 py-1 rounded-md text-[9px] font-bold border ${isFirebaseConfigured ? 'text-emerald-600 border-emerald-500' : 'text-orange-500 border-orange-500'}`}>
                  {isFirebaseConfigured ? 'FIREBASE SECURE' : 'SANDBOX DEMO MODE'}
                </span>
              </div>
              <div className="text-[13px] text-slate-700 leading-relaxed font-medium">
                {isFirebaseConfigured ? (
                  'All auth state changes and project collections synchronize dynamically to your Cloud Firestore cluster in real-time.'
                ) : (
                  <>
                    Running in Local Sandbox with mock CFO database accounts.<br />
                    Connecting Firebase credentials via .env.local launches Cloud Auth.
                  </>
                )}
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2">
                <span>VANTAGE CFO Suite</span>
                <span>Active Branch: main</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        </div>

        {/* Right Column: Auth Forms */}
        <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white">
          <div className="w-full max-w-[400px] mx-auto">

            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="bg-white p-1 rounded-xl shadow-md border border-slate-200 shrink-0">
                <img
                  src="/vanntagge-logo.png"
                  alt="VANNTAGGE CFO SERVICES LLP"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <span className="text-lg font-extrabold text-on-surface font-outfit">VANNTAGGE</span>
            </div>

            {/* ERROR / SUCCESS ALERTS */}
            {errorMsg && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-xs font-medium leading-relaxed flex items-start justify-between gap-3">
                <span>{errorMsg}</span>
                {errorAction === 'switch_to_login' && (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setErrorMsg(''); setErrorAction(null); }}
                    className="shrink-0 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap"
                  >
                    Sign In →
                  </button>
                )}
              </div>
            )}
            {successMsg && (
              <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-150 text-green-800 text-xs font-medium leading-relaxed">
                {successMsg}
              </div>
            )}

            {/* MODE 1: LOGIN */}
            {authMode === 'login' && (
              <div>
                <header className="mb-6">
                  <h2 className="text-2xl font-bold text-on-surface mb-2 font-sans">
                    Sign In
                  </h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Select your workspace role or enter your credentials below to access the suite.
                  </p>
                </header>

                {/* Quick Role Selector */}
                <div className="mb-6 grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('aaratimule006@gmail.com');
                      setPassword('demo');
                    }}
                    className={`py-2 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${email.includes('admin') || email.includes('006')
                      ? 'bg-white text-blue-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('aarati123@gmail.com');
                      setPassword('demo');
                    }}
                    className={`py-2 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${email.includes('aarati123') || email.includes('priya') || email.includes('employee')
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">badge</span>
                    <span>Employee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('aaratideepak29@gmail.com');
                      setPassword('demo');
                    }}
                    className={`py-2 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${email.includes('29') || email.includes('client')
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">business_center</span>
                    <span>Client</span>
                  </button>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant flex justify-between" htmlFor="login-email">
                      <span>Email Address</span>
                      {!isFirebaseConfigured && (
                        <span className="text-primary hover:underline cursor-help" onClick={() => alert('Demo logins: sarah.jenkins@vanntagge.com, priya.sharma@vanntagge.com')}>Demo Users?</span>
                      )}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </div>
                      <input
                        type="email"
                        id="login-email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-lg border border-outline-variant/60 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="login-password">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                      </div>
                      <input
                        type="password"
                        id="login-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-lg border border-outline-variant/60 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <SimpleCaptcha onValidate={setCaptchaValid} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-lg shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    {loading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <span>{isFirebaseConfigured ? 'Sign In to Workspace' : 'Verify & Enter Dashboard'}</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="h-px bg-outline-variant/50 flex-1"></div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-widest">Or</span>
                  <div className="h-px bg-outline-variant/50 flex-1"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="mt-4 w-full bg-surface-container-low border border-outline-variant/50 hover:bg-surface-variant text-on-surface font-semibold py-3 rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-4 h-4" />
                  <span>Continue with Google</span>
                </button>

                {/* Demo accounts helper cards */}
                {!isFirebaseConfigured && (
                  <div className="mt-6 p-3 rounded-lg bg-surface border border-outline-variant/30 space-y-2">
                    <h4 className="text-[10px] font-bold uppercase text-outline tracking-wider">Default Test Personas</h4>
                    <div className="space-y-1.5 text-[10px] text-on-surface-variant">
                      <div
                        onClick={() => {
                          setEmail('aaratimule006@gmail.com');
                          setPassword('demo');
                        }}
                        className="cursor-pointer hover:text-primary transition-all flex justify-between font-semibold text-primary"
                      >
                        <span>Aarati Mule (Super Admin)</span>
                        <span className="font-bold underline">Auto-fill</span>
                      </div>
                      <div
                        onClick={() => {
                          setEmail('aarati123@gmail.com');
                          setPassword('demo');
                        }}
                        className="cursor-pointer hover:text-primary transition-all flex justify-between font-semibold text-blue-700"
                      >
                        <span>Aarati (Employee)</span>
                        <span className="font-bold underline">Auto-fill</span>
                      </div>
                      <div
                        onClick={() => {
                          setEmail('kiranm@gmail.com');
                          setPassword('demo');
                        }}
                        className="cursor-pointer hover:text-primary transition-all flex justify-between font-semibold text-blue-700"
                      >
                        <span>Kiran (Employee)</span>
                        <span className="font-bold underline">Auto-fill</span>
                      </div>
                      <div
                        onClick={() => {
                          setEmail('aaratideepak29@gmail.com');
                          setPassword('demo');
                        }}
                        className="cursor-pointer hover:text-primary transition-all flex justify-between font-semibold text-emerald-600"
                      >
                        <span>Aarati (Client)</span>
                        <span className="font-bold underline">Auto-fill</span>
                      </div>

                    </div>
                  </div>
                )}

                <footer className="mt-8 pt-6 border-t border-outline-variant/30 flex flex-col items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthMode('forgot');
                      setErrorMsg('');
                      setErrorAction(null);
                      setSuccessMsg('');
                    }}
                    className="text-xs text-outline hover:text-primary"
                  >
                    Forgot Password?
                  </button>
                </footer>
              </div>
            )}

            {/* MODE 2: REGISTER */}
            {authMode === 'register' && (
              <div>
                <header className="mb-6">
                  <h2 className="text-2xl font-bold text-on-surface mb-2 font-outfit">Create Account</h2>
                  <p className="text-xs text-on-surface-variant">
                    {isFirebaseConfigured
                      ? 'Register your profile details below to initiate a live Firebase user record.'
                      : 'Configure a new user account below and choose their role to simulate specific RBAC layout permissions.'}
                  </p>
                </header>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="reg-name">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="reg-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 bg-surface rounded-lg border border-outline-variant/60 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="reg-email">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="reg-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane.doe@company.com"
                      className="w-full px-4 py-2.5 bg-surface rounded-lg border border-outline-variant/60 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="reg-code">
                      Firm Registration Code
                    </label>
                    <input
                      type="text"
                      id="reg-code"
                      required
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="e.g. VANTAGE2026"
                      className="w-full px-4 py-2.5 bg-surface rounded-lg border border-outline-variant/60 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="reg-password">
                      Password
                    </label>
                    <input
                      type="password"
                      id="reg-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-surface rounded-lg border border-outline-variant/60 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <SimpleCaptcha onValidate={setCaptchaValid} />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-lg shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    {loading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <span>Register & Sign In</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="h-px bg-outline-variant/50 flex-1"></div>
                  <span className="text-[10px] text-outline uppercase font-bold tracking-widest">Or</span>
                  <div className="h-px bg-outline-variant/50 flex-1"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="mt-4 w-full bg-surface-container-low border border-outline-variant/50 hover:bg-surface-variant text-on-surface font-semibold py-3 rounded-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-4 h-4" />
                  <span>Sign up with Google</span>
                </button>

                <footer className="mt-8 pt-6 border-t border-outline-variant/30 flex justify-center">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg('');
                      setErrorAction(null);
                      setSuccessMsg('');
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Back to Log In
                  </button>
                </footer>
              </div>
            )}

            {/* MODE 3: FORGOT PASSWORD */}
            {authMode === 'forgot' && (
              <div>
                <header className="mb-6">
                  <h2 className="text-2xl font-bold text-on-surface mb-2 font-outfit">Reset Password</h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                  </p>
                </header>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant" htmlFor="forgot-email">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                      </div>
                      <input
                        type="email"
                        id="forgot-email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-lg border border-outline-variant/60 text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-on-primary font-semibold py-3.5 rounded-lg shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    {loading ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </form>

                <footer className="mt-8 pt-6 border-t border-outline-variant/30 flex justify-center">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Back to Log In
                  </button>
                </footer>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Fake Google Auth Modal for Sandbox */}
      {showGoogleMock && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-8 h-8 mb-3" />
              <h2 className="text-lg font-medium text-slate-800">
                Sign in with Google
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose an account to continue
              </p>
            </div>
            
            <div className="py-2">
              <button 
                onClick={() => handleMockGoogleLogin('aaratimule006@gmail.com', '/admin')}
                className="w-full flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  A
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800 text-sm">Aarati Mule</p>
                  <p className="text-xs text-slate-500">aaratimule006@gmail.com <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded ml-1 uppercase">Super Admin</span></p>
                </div>
              </button>

              <button 
                onClick={() => handleMockGoogleLogin('aarati123@gmail.com', '/employee')}
                className="w-full flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  A
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800 text-sm">Aarati (Employee)</p>
                  <p className="text-xs text-slate-500">aarati123@gmail.com <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded ml-1 uppercase">Staff</span></p>
                </div>
              </button>

              <button 
                onClick={() => handleMockGoogleLogin('aaratideepak29@gmail.com', '/client')}
                className="w-full flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  A
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800 text-sm">Aarati Deepak</p>
                  <p className="text-xs text-slate-500">aaratideepak29@gmail.com <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded ml-1 uppercase">Client</span></p>
                </div>
              </button>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowGoogleMock(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
