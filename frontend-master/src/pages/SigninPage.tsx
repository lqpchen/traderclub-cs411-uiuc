import React, { useState, MouseEvent } from "react"
import { unwrapResult } from "@reduxjs/toolkit"
import Alert from "@material-ui/lab/Alert"
import {
    Button,
    CircularProgress,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    makeStyles,
    OutlinedInput,
    Paper
} from "@material-ui/core"
import Typography from "@material-ui/core/Typography"

import { useFormik } from "formik"
import { useSelector } from "react-redux"
import * as yup from "yup"

import {AuthState, performSigninByEmail} from "../slices/auth"
import {AppState, dispatch} from "../store"
import { AccountCircle, Visibility, VisibilityOff } from "@material-ui/icons"
import { useHistory } from "react-router"

const useStyles = makeStyles({
    paperStyle: {
        width: "60%",
        margin: "3rem auto"
    },
    loginProgress: {
        marginRight: "1rem"
    },
    iconButton: {
        padding: 0
    },
    enterButton: {
        marginRight: "1rem"
    },
    headerStyle: {
        textAlign: "center",
        fontWeight: "bold"
    },
    flowerStyle: {
        width: "30%",
        height: "30%",
        margin: "0 auto"
    }
})

function SigninPage(): React.ReactElement {
    const history = useHistory()
    const classes = useStyles()

    const [state, setState] = useState({ showPassword: false })
    const auth = useSelector<AppState, AuthState>((state) => state.auth)

    const handleOnSignup = (e: MouseEvent) => {

        e.preventDefault()
        history.push("/signup")

    }

    const validationSchema = yup.object({
        email: yup.string().label("Enter your email").email("Enter a valid email").required("Email is required"),
        password: yup
            .string()
            .label("Enter your password")
            .min(8, "Password should be of minimum 8 characters length")
            .required("Password is required")
    })

    const formik = useFormik({
        enableReinitialize: false,
        initialValues: { email: "", password: "" },
        validationSchema: validationSchema,
        onSubmit: async (values, { setErrors, setValues, setSubmitting, setStatus }) => {
            const signinRequest = {
                email: values.email,
                password: values.password
            }

            dispatch(performSigninByEmail(signinRequest))
                .then(unwrapResult)
                .then((result) => {
                    setStatus({ success: true })
                    history.push("/dashboard")
                })
                .catch((error) => {
                    setStatus({ success: false })
                    setSubmitting(false)
                })
        }
    })

    return (
        <Paper elevation={3} className={classes.paperStyle}>
            <form onSubmit={formik.handleSubmit}>
                <Grid container direction="column" spacing={3} justify="center" alignContent="center">
                    <Typography variant="h3">Traders Club</Typography>

                    <Grid item xs={12}>
                        <Typography variant="h4" gutterBottom className={classes.headerStyle}>
                            Sign In
                        </Typography>
                    </Grid>

                    {auth.error && (
                        <Grid item xs={12}>
                            <Alert variant="outlined" severity="error">
                                Authentication failed
                            </Alert>
                        </Grid>
                    )}

                    <Grid item xs={10}>
                        <FormControl fullWidth={true} variant="outlined">
                            <InputLabel htmlFor="email">E-mail</InputLabel>
                            <OutlinedInput
                                id="email"
                                type="text"
                                fullWidth={true}
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                startAdornment={
                                    <InputAdornment position="start">
                                        <AccountCircle />
                                    </InputAdornment>
                                }
                                labelWidth={70}
                            />

                            {formik.touched.email && <FormHelperText>{formik.errors.email}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={10}>
                        <FormControl fullWidth={true} variant="outlined">
                            <InputLabel htmlFor="password">Password</InputLabel>
                            <OutlinedInput
                                id="password"
                                type={state.showPassword ? "text" : "password"}
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setState({ showPassword: !state.showPassword })}
                                            edge="end"
                                        >
                                            {state.showPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                labelWidth={70}
                            />

                            {formik.touched.password && <FormHelperText>{formik.errors.password}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <Button
                            className={classes.enterButton}
                            disabled={auth.isLoggingIn}
                            variant="contained"
                            color="primary"
                            type="submit"
                        >
                            {auth.isLoggingIn && <CircularProgress size={10} className={classes.loginProgress} />}
                            Enter
                        </Button>

                        <Button variant="contained" onClick={handleOnSignup}>
                            Signup
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    )
}

export default SigninPage
