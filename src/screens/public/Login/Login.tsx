// -------------------------------------------------------------------------------------------

import './Login.scss';

import { AxiosResponse } from 'axios';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

import { LoginOutlined, VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import {
    FormControl, FormHelperText, IconButton, InputAdornment, InputLabel, OutlinedInput, Typography
} from '@mui/material';

import AppDetails from '../../../app/appDetails';
import { useAuth } from '../../../contexts/Auth/Auth';
import { verifyCaptcha } from '../../../services/recaptcha/recaptcha';
import { verifyUser } from '../../../services/user/user';
import { VerifyUserInterface } from '../../../services/user/user.types';
import hashData from '../../../utils/hashData';

// -------------------------------------------------------------------------------------------

const Login = () => {
	const title = 'Login';
	const [formData, setFormData] = useState<VerifyUserInterface>({
		companyCode: '',
		username: '',
		password: '',
	});
	const [errors, setErrors] = useState({
		companyCode: '',
		username: '',
		password: '',
	});
	const [loading, setLoading] = useState<boolean>(false);
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const recaptchaRef = useRef<any>(null);
	const [recaptchaToken, setRecaptchaToken] = useState('');
	const [isRecaptchaVerified, setIsRecaptchaVerified] =
		useState<boolean>(false);
	const { handleLogin, handleLogout } = useAuth();

	useEffect(() => {
		document.title = `${title} • ${AppDetails.Title}`;
	}, []);

	// const handleCaptchaChange = async (token: string | null) => {
	// 	if (token) {
	// 		setRecaptchaToken(token);

	// 		const isVerified = await verifyCaptcha(token);

	// 		if (isVerified) {
	// 			setIsRecaptchaVerified(true);
	// 		} else {
	// 			resetCaptcha();
	// 		}
	// 	}
	// };

	// const resetCaptcha = () => {
	// 	setRecaptchaToken('');
	// 	setIsRecaptchaVerified(false);

	// 	if (recaptchaRef.current) {
	// 		recaptchaRef.current.reset();
	// 	}
	// };

	// const handleCaptchaExpiry = () => {
	// 	setRecaptchaToken('');
	// };

	// const handleCaptchaError = () => {
	// 	setRecaptchaToken('');
	// };

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const validateCompanyCode = (): boolean => {
		if (!formData.companyCode) {
			setErrors((prev) => ({
				...prev,
				companyCode: 'Company Code is required',
			}));

			return false;
		} else {
			setErrors((prev) => ({
				...prev,
				companyCode: '',
			}));

			return true;
		}
	};

	const validateUsername = (): boolean => {
		if (!formData.username) {
			setErrors((prev) => ({
				...prev,
				username: 'Username is required',
			}));

			return false;
		} else {
			setErrors((prev) => ({
				...prev,
				username: '',
			}));

			return true;
		}
	};

	const validatePassword = (): boolean => {
		if (!formData.password) {
			setErrors((prev) => ({
				...prev,
				password: 'Password is required',
			}));

			return false;
		} else {
			setErrors((prev) => ({
				...prev,
				password: '',
			}));

			return true;
		}
	};

	const validateForm = (): boolean => {
		const isCompanyCodeValid = validateCompanyCode();
		const isUsernameValid = validateUsername();
		const isPasswordValid = validatePassword();

		if (isCompanyCodeValid && isUsernameValid && isPasswordValid) {
			return true;
		} else {
			return false;
		}
	};

	const handleSubmit = async () => {
		if (validateForm() && isRecaptchaVerified) {
			if (recaptchaToken && isRecaptchaVerified) {
				setLoading(true);

				const data = {
					...formData,
					password: hashData(formData.password),
				};

				const response: AxiosResponse | any = await verifyUser(data);

				if (response.status === 200) {
					handleLogin();
				} else {
					handleLogout();
					alert(
						'Login failed. Please check your credentials and try again.'
					);
				}

				setLoading(false);
				
			} else {
				handleLogout();
				alert('reCAPTCHA token not available');
			}
		}
	};

	return (
		<div
			data-component='login'
			className='container'
		>
			<div
				data-component='login'
				className='top'
			>
				<Typography
					variant='h4'
					data-component='login'
					className='title'
				>
					Login
				</Typography>
				<Typography
					variant='body2'
					data-component='login'
					className='subtitle'
				>
					Welcome back! Please sign in to continue.
				</Typography>
			</div>
			<div
				data-component='login'
				className='middle'
			>
				<FormControl
					size='medium'
					variant='outlined'
					fullWidth
					error={!!errors.companyCode}
					disabled={loading}
				>
					<InputLabel htmlFor='company-code'>Company Code</InputLabel>
					<OutlinedInput
						label='Company Code'
						id='company-code'
						type='text'
						name='companyCode'
						value={formData.companyCode}
						onChange={handleChange}
						onBlur={validateCompanyCode}
					/>
					{errors.companyCode && (
						<FormHelperText>{errors.companyCode}</FormHelperText>
					)}
				</FormControl>
				<FormControl
					size='medium'
					variant='outlined'
					fullWidth
					error={!!errors.username}
					disabled={loading}
				>
					<InputLabel htmlFor='company-code'>Username</InputLabel>
					<OutlinedInput
						label='Username'
						id='username'
						type='text'
						name='username'
						value={formData.username}
						onChange={handleChange}
						onBlur={validateUsername}
					/>
					{errors.username && (
						<FormHelperText>{errors.username}</FormHelperText>
					)}
				</FormControl>
				<FormControl
					size='medium'
					variant='outlined'
					fullWidth
					error={!!errors.password}
					disabled={loading}
				>
					<InputLabel htmlFor='password'>Password</InputLabel>
					<OutlinedInput
						label='Password'
						id='password'
						type={isPasswordVisible ? 'text' : 'password'}
						name='password'
						value={formData.password}
						onChange={handleChange}
						onBlur={validatePassword}
						endAdornment={
							<InputAdornment position='end'>
								<IconButton
									aria-label='toggle password visibility'
									onClick={() => {
										setIsPasswordVisible((prev) => !prev);
									}}
									edge='end'
								>
									{isPasswordVisible ? (
										<VisibilityOffOutlined />
									) : (
										<VisibilityOutlined />
									)}
								</IconButton>
							</InputAdornment>
						}
					/>
					{errors.password && (
						<FormHelperText>{errors.password}</FormHelperText>
					)}
				</FormControl>
				<ReCAPTCHA
					ref={recaptchaRef}
					sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
					
				/>
			</div>
			<div
				data-component='login'
				className='bottom'
			>
				<LoadingButton
					fullWidth
					size='large'
					variant='contained'
					color='primary'
					startIcon={<LoginOutlined />}
					data-component='login'
					className='filled-button'
					disabled={isRecaptchaVerified ? false : true}
					onClick={handleSubmit}
					loading={loading}
				>
					Login
				</LoadingButton>
			</div>
		</div>
	);
};

// -------------------------------------------------------------------------------------------

export default Login;

// -------------------------------------------------------------------------------------------
