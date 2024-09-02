// -------------------------------------------------------------------------------------------

import './ArticleShapes.scss';

import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table';
import { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AddOutlined, DeleteOutline, EditOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, FormControl, FormHelperText,
    IconButton, InputLabel, OutlinedInput, Tooltip
} from '@mui/material';

import Alert from '../../../components/Alert/Alert';
import { AlertInterface, AlertStates } from '../../../components/Alert/Alert.types';
import Fallback from '../../../components/Fallback/Fallback';
import { FallbackStateType } from '../../../components/Fallback/Fallback.types';
import Search from '../../../components/Search/Search';
import { useApi } from '../../../contexts/Api/Api';
import { useApp } from '../../../contexts/App/App';
import { useAuth } from '../../../contexts/Auth/Auth';
import {
    createArticleShapeAsync, deleteArticleShapeAsync, updateArticleShapeAsync
} from '../../../services/articleShape/articleShape';
import { ArticleShapeInterface } from '../../../services/articleShape/articleShape.types';
import addIndex from '../../../utils/addIndex';

// -------------------------------------------------------------------------------------------

const defaultFormData: ArticleShapeInterface = { articleShape: '' };
const defaultFormErrors = { articleShape: '' };

// -------------------------------------------------------------------------------------------

const ArticleShapes = memo(() => {
	const { setTitle } = useApp();
	const { handleLogout } = useAuth();
	const { getArticleShapes, setArticleShapes } = useApi();

	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
	const [isFormDialogEditMode, setIsFormDialogEditMode] = useState(false);
	const [isFormDialogLoading, setIsFormDialogLoading] = useState(false);
	const [fallbackState, setFallbackState] =
		useState<FallbackStateType>('loading');
	const [articleShapes, _setArticleShapes] = useState<
		ArticleShapeInterface[]
	>([]);
	const [formData, setFormData] =
		useState<ArticleShapeInterface>(defaultFormData);
	const [formErrors, setFormErrors] = useState(defaultFormErrors);
	const [alertDialog, setAlertDialog] = useState<AlertInterface>({
		state: 'success',
		label: '',
		isActive: false,
	});

	useEffect(() => {
		setTitle('Article Shapes');
		initialFetch();
	}, [getArticleShapes, setTitle]);

	useEffect(() => {
		const updateWindowWidth = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', updateWindowWidth);
		return () => window.removeEventListener('resize', updateWindowWidth);
	}, []);

	const initialFetch = useCallback(async () => {
		const articleShapesData = await getArticleShapes();

		if (articleShapesData.length !== 0) {
			_setArticleShapes(articleShapesData);
			setFallbackState('hidden');
		} else {
			setFallbackState('not-found');
		}
	}, [getArticleShapes]);

	const handleOpenFormDialog = useCallback((data?: ArticleShapeInterface) => {
		setIsFormDialogOpen(true);
		if (data) {
			setFormData(data);
			setIsFormDialogEditMode(true);
		}
	}, []);

	const handleCloseFormDialog = useCallback(() => {
		setIsFormDialogOpen(false);
		setFormData(defaultFormData);
		setFormErrors(defaultFormErrors);
		setIsFormDialogEditMode(false);
		setIsFormDialogLoading(false);
		handleCloseAlertDialog();
	}, []);

	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	}, []);

	const handleOpenAlertDialog = useCallback(
		(state: AlertStates, label: string) => {
			setAlertDialog({ state, label, isActive: true });
		},
		[]
	);

	const handleCloseAlertDialog = useCallback(() => {
		setAlertDialog({ state: 'success', label: '', isActive: false });
	}, []);

	const handleSearch = async (keyword: string) => {
		const array = await getArticleShapes();

		if (!keyword || keyword.trim() === '') {
			_setArticleShapes(array);
			return;
		}

		const regex = new RegExp(keyword.trim(), 'i');
		const filteredShapes = array.filter((shape) =>
			regex.test(shape.articleShape)
		);

		_setArticleShapes(addIndex.addIndex3(filteredShapes));
	};

	const validateArticleShape = useCallback((): boolean => {
		if (!formData.articleShape) {
			setFormErrors({ articleShape: 'Article Shape is required.' });
			return false;
		}
		setFormErrors({ articleShape: '' });
		return true;
	}, [formData]);

	const handleCreateArticleShape = useCallback(async () => {
		if (!validateArticleShape()) return;

		const data = { ...formData };

		setIsFormDialogLoading(true);
		try {
			const response = await createArticleShapeAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const newArticleShape: ArticleShapeInterface = {
						...formData,
						articleShapeId: response.data.data,
					};
					setArticleShapes((prev) =>
						addIndex.addIndex3([newArticleShape, ...prev])
					);
					handleCloseFormDialog();
					handleOpenAlertDialog(
						'success',
						'Created new Article Shape.'
					);
				} else {
					handleOpenAlertDialog('warning', response.data.data);
				}
			} else {
				handleLogout();
			}
		} catch (error) {
			handleLogout();
		} finally {
			setIsFormDialogLoading(false);
		}
	}, [
		formData,
		validateArticleShape,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		setArticleShapes,
	]);

	const handleUpdateArticleShape = useCallback(async () => {
		if (!validateArticleShape()) return;

		const data = { ...formData };

		setIsFormDialogLoading(true);
		try {
			const response = await updateArticleShapeAsync(data);
			if (
				response &&
				typeof response !== 'boolean' &&
				response.data.status !== 401
			) {
				if (response.data.status === 200) {
					const updatedArticleShapes = articleShapes.map((obj) =>
						obj.articleShapeId === formData.articleShapeId
							? { ...obj, articleShape: formData.articleShape }
							: obj
					);

					setArticleShapes(addIndex.addIndex3(updatedArticleShapes));
					handleCloseFormDialog();
					handleOpenAlertDialog('success', 'Updated Article Shape.');
				} else {
					handleOpenAlertDialog('warning', response.data.data);
				}
			} else {
				handleLogout();
			}
		} catch (error) {
			handleLogout();
		} finally {
			setIsFormDialogLoading(false);
		}
	}, [
		formData,
		validateArticleShape,
		handleCloseFormDialog,
		handleOpenAlertDialog,
		handleLogout,
		articleShapes,
		setArticleShapes,
	]);

	const handleDeleteArticleShape = useCallback(
		async (data: ArticleShapeInterface) => {
			const confirm = window.confirm(
				`Are you sure you want to delete Article Shape '${data.articleShape}'?`
			);
			if (!confirm) return;

			const articleShapeId = data.articleShapeId as number;

			try {
				const response = await deleteArticleShapeAsync(articleShapeId);
				if (
					response &&
					typeof response !== 'boolean' &&
					response.data.status !== 401
				) {
					if (response.data.status === 200) {
						const updatedArticleShapes = articleShapes.filter(
							(obj) => obj.articleShapeId !== articleShapeId
						);
						setArticleShapes(addIndex.addIndex3(updatedArticleShapes));
						handleOpenAlertDialog(
							'success',
							'Deleted Article Shape.'
						);
					} else {
						handleOpenAlertDialog('warning', response.data.data);
					}
				} else {
					handleLogout();
				}
			} catch (error) {
				handleLogout();
			}
		},
		[articleShapes, handleLogout, handleOpenAlertDialog, setArticleShapes]
	);

	const columns = useMemo<MRT_ColumnDef<ArticleShapeInterface>[]>(
		() => [
			{
				accessorKey: 'index',
				header: '#',
				enableResizing: false,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'articleShape',
				header: 'Article Shape',
				enableResizing: true,
				size: 80,
				muiTableHeadCellProps: { align: 'left' },
				muiTableBodyCellProps: { align: 'left' },
				muiTableFooterCellProps: { align: 'left' },
			},
			{
				accessorKey: 'actions',
				header: 'Actions',
				enableResizing: false,
				enableColumnFilter: false,
				enableSorting: false,
				size: 100,
				muiTableHeadCellProps: { align: 'right' },
				muiTableBodyCellProps: { align: 'right' },
				muiTableFooterCellProps: { align: 'right' },
				Cell: ({ row }) => (
					<>
						<Tooltip title='Delete Article Shape'>
							<IconButton
								onClick={() =>
									handleDeleteArticleShape(row.original)
								}
							>
								<DeleteOutline />
							</IconButton>
						</Tooltip>
						<Tooltip title='Edit Article Shape'>
							<IconButton
								onClick={() =>
									handleOpenFormDialog(row.original)
								}
							>
								<EditOutlined />
							</IconButton>
						</Tooltip>
					</>
				),
			},
		],
		[handleDeleteArticleShape, handleOpenFormDialog]
	);

	const table = useMaterialReactTable({
		columns,
		data: articleShapes,
		filterFromLeafRows: true,
		paginateExpandedRows: false,
		enableColumnResizing: true,
		enablePagination: true,
		layoutMode: 'grid',
		enableDensityToggle: false,
		initialState: {
			pagination: { pageSize: 100, pageIndex: 0 },
			density: 'compact',
			sorting:[{id: "articleShape", desc: false}]
		},
		muiPaginationProps: { rowsPerPageOptions: [100, 200, 500, 1000] },
		muiTablePaperProps: {
			sx: {
				borderRadius: 'var(--shape-medium)',
				boxShadow: 'var(--elevation-extra-small)',
			},
		},
		muiTableBodyCellProps: { sx: { paddingTop: 0, paddingBottom: 0 } },
	});

	return (
		<>
			<div
				data-component='article-shapes'
				className='container'
			>
				<div
					data-component='article-shapes'
					className='top'
				>
					<Search
						onChange={handleSearch}
						isDisabled={fallbackState !== 'hidden'}
					/>
					{windowWidth > 600 && (
						<Tooltip title='Create New Article Shape'>
							<Fab
								variant='extended'
								color='primary'
								data-component='article-shapes'
								className='fab'
								onClick={() => handleOpenFormDialog()}
							>
								<AddOutlined />
								Create new
							</Fab>
						</Tooltip>
					)}
				</div>
				<div
					data-component='article-shapes'
					className='bottom'
				>
					{fallbackState !== 'hidden' ? (
						<Fallback state={fallbackState} />
					) : (
						<div
							data-component='article-shapes'
							className='table-container'
						>
							<MaterialReactTable table={table} />
						</div>
					)}
				</div>
			</div>

			{windowWidth < 600 && (
				<div
					data-component='article-shapes'
					className='fab-container'
				>
					<Tooltip title='Create New Article Shape'>
						<Fab
							variant='extended'
							color='primary'
							data-component='article-shapes'
							className='fab'
							onClick={() => handleOpenFormDialog()}
						>
							<AddOutlined />
							Create new
						</Fab>
					</Tooltip>
				</div>
			)}

			<Dialog
				open={isFormDialogOpen}
				onClose={handleCloseFormDialog}
				fullWidth={true}
			>
				<DialogTitle>
					{!isFormDialogEditMode
						? 'Create New Article Shape'
						: 'Edit Article Shape'}
				</DialogTitle>
				<DialogContent>
					<FormControl
						size='medium'
						variant='outlined'
						fullWidth
						error={!!formErrors.articleShape}
						disabled={isFormDialogLoading}
						margin='dense'
					>
						<InputLabel htmlFor='article-shape'>
							Article Shape
						</InputLabel>
						<OutlinedInput
							label='Article Shape'
							id='article-shape'
							type='text'
							name='articleShape'
							value={formData.articleShape}
							onChange={handleChange}
							onBlur={validateArticleShape}
						/>
						{formErrors.articleShape && (
							<FormHelperText>
								{formErrors.articleShape}
							</FormHelperText>
						)}
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseFormDialog}>Close</Button>
					<LoadingButton
						color='primary'
						onClick={
							!isFormDialogEditMode
								? handleCreateArticleShape
								: handleUpdateArticleShape
						}
						loading={isFormDialogLoading}
						type='submit'
					>
						Save
					</LoadingButton>
				</DialogActions>
			</Dialog>

			<Alert
				{...alertDialog}
				onClose={handleCloseAlertDialog}
			/>
		</>
	);
});

// -------------------------------------------------------------------------------------------

export default ArticleShapes;

// -------------------------------------------------------------------------------------------
