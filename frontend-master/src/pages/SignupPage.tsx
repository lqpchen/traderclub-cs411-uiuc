import React, { MouseEvent, useState } from "react"
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
import * as yup from "yup"
import {useHistory} from "react-router"
import { AccountCircle, Visibility, VisibilityOff } from "@material-ui/icons"
import { signup } from "../api/auth"

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

export default function SignupPage(): React.ReactElement {
    const history = useHistory()
    const classes = useStyles()

    const [showPassword, setShowPassword] = useState(false)
    const [isSignupFailed, setIsSignupFailed] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const validationSchema = yup.object({
        firstName: yup.string().required("First name is required"),
        lastName: yup.string().required("Last name is required"),
        email: yup.string().email("Enter a valid email").required("Email is required"),
        password: yup
            .string()
            .min(8, "Password should be of minimum 8 characters length")
            .required("Password is required"),
        repeatPassword: yup
            .string()
            .min(8, "Password should be of minimum 8 characters length")
            .required("Password is required")
            .oneOf([yup.ref("password")], "Both password need to be the same")
    })

    const formik = useFormik({
        initialValues: { firstName: "", lastName: "", email: "", password: "", repeatPassword: "" },
        validationSchema: validationSchema,
        onSubmit: async (values, { setErrors }) => {
            setIsProcessing(true)
            setIsSignupFailed(false)

            const signupRequest = {
                email: values.email,
                password: values.password,
                full_name: values.firstName + " " + values.lastName
            }

            signup(signupRequest)
                .then(() => history.push("/login"))
                .catch((error) => {
                    history.push("/login")
                })
                .finally(() => setIsProcessing(false))
        }
    })

    const handleGoBack = (event: MouseEvent) => {
        event.preventDefault()

        history.replace("/login")
    }

    return (
        <Paper elevation={3} className={classes.paperStyle}>
            <form onSubmit={formik.handleSubmit}>
                <Grid container direction="column" spacing={3} justify="center" alignContent="center">
                    <Grid item xs={12}>
                        <Typography variant="h4" gutterBottom className={classes.headerStyle}>
                            New Account
                        </Typography>
                    </Grid>

                    {isSignupFailed && (
                        <Grid item xs={12}>
                            <Alert variant="outlined" severity="error">
                                Signup failed
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
                            <InputLabel htmlFor="firstName">First name</InputLabel>
                            <OutlinedInput
                                id="firstName"
                                type="text"
                                fullWidth={true}
                                value={formik.values.firstName}
                                onChange={formik.handleChange}
                                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                                labelWidth={70}
                            />

                            {formik.touched.firstName && <FormHelperText>{formik.errors.firstName}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={10}>
                        <FormControl fullWidth={true} variant="outlined">
                            <InputLabel htmlFor="lastName">Last name</InputLabel>
                            <OutlinedInput
                                id="lastName"
                                type="text"
                                fullWidth={true}
                                value={formik.values.lastName}
                                onChange={formik.handleChange}
                                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                                labelWidth={70}
                            />

                            {formik.touched.lastName && <FormHelperText>{formik.errors.lastName}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={10}>
                        <FormControl fullWidth={true} variant="outlined">
                            <InputLabel htmlFor="password">Password</InputLabel>
                            <OutlinedInput
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <Visibility /> : <VisibilityOff />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                labelWidth={70}
                            />

                            {formik.touched.password && <FormHelperText>{formik.errors.password}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={10}>
                        <FormControl fullWidth={true} variant="outlined">
                            <InputLabel htmlFor="repeatPassword">Repeat password</InputLabel>
                            <OutlinedInput
                                id="repeatPassword"
                                type={showPassword ? "text" : "password"}
                                value={formik.values.repeatPassword}
                                onChange={formik.handleChange}
                                error={formik.touched.repeatPassword && Boolean(formik.errors.repeatPassword)}
                                labelWidth={70}
                            />

                            {formik.touched.password && <FormHelperText>{formik.errors.repeatPassword}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <Button disabled={isProcessing} variant="contained" color="primary" type="submit">
                            {isProcessing && <CircularProgress size={10} className={classes.loginProgress} />}
                            Continue
                        </Button>
                    </Grid>

                    <Grid item xs={12}>
                        <Button variant="contained" onClick={handleGoBack}>
                            Return
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    )
}
