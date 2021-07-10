import React, { MouseEvent, useState } from "react"
import { createStyles, makeStyles, useTheme } from "@material-ui/core/styles"
import AppBar from "@material-ui/core/AppBar"
import Toolbar from "@material-ui/core/Toolbar"
import Typography from "@material-ui/core/Typography"
import AccountCircle from "@material-ui/icons/AccountCircle"
import ForumIcon from '@material-ui/icons/Forum';
import ViewListIcon from '@material-ui/icons/ViewList';
import IconButton from "@material-ui/core/IconButton"
import MenuIcon from "@material-ui/icons/Menu"
import MenuItem from "@material-ui/core/MenuItem"
import Menu from "@material-ui/core/Menu"
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft"
import ChevronRightIcon from "@material-ui/icons/ChevronRight"
import MailIcon from "@material-ui/icons/Mail"
import CssBaseline from "@material-ui/core/CssBaseline"
import { Route, Switch, useRouteMatch } from "react-router-dom"
import clsx from "clsx"
import Drawer from "@material-ui/core/Drawer"
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown"
import ArrowRightIcon from "@material-ui/icons/ArrowRight"
import { useSelector } from "react-redux"
import {AppState, dispatch} from "../store"
import { TreeView } from "@material-ui/lab"
import StyledTreeItem from "../components/StyledTreeItem"
import { useHistory } from "react-router"
import { loggedOut } from "../slices/user"
import CompaniesList from "../components/companies/CompaniesList"
import Settings from "../components/companies/Settings"
import { Divider } from "@material-ui/core"
import Watchlist from "../components/companies/Watchlist"
import StockDiscussions from "../components/discussions/StockDiscussions";
import NewDiscussionThread from "../components/discussions/NewDiscussionThread";
import CompanyArticles from "../components/articles/CompanyArticles";
import DiscussionThread from "../components/discussions/DiscussionThread";
import GlobalArticles from "../components/articles/GlobalArticles";
import {NextWeekSharp} from "@material-ui/icons";
import CompanyFinancials from "../components/companies/CompanyFinancials"
import EditDiscussionThreadReply from "../components/discussions/EditDiscussionThreadReply"

const drawerWidth = 240
const useStyles = makeStyles((theme) =>
    createStyles({
        treeView: {
            height: 264,
            flexGrow: 1,
            maxWidth: 400
        },
        root: {
            display: "flex"
        },
        menuButton: {
            marginRight: theme.spacing(2)
        },
        appBar: {
            transition: theme.transitions.create(["margin", "width"], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen
            })
        },
        appBarShift: {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: drawerWidth,
            transition: theme.transitions.create(["margin", "width"], {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen
            })
        },
        title: {
            flexGrow: 1
        },
        hide: {
            display: "none"
        },
        drawer: {
            width: drawerWidth,
            flexShrink: 0
        },
        drawerPaper: {
            width: drawerWidth
        },
        drawerHeader: {
            display: "flex",
            alignItems: "center",
            padding: theme.spacing(0, 1),
            // necessary for content to be below app bar
            ...theme.mixins.toolbar,
            justifyContent: "flex-end"
        },
        content: {
            flexGrow: 1,
            padding: theme.spacing(3),
            transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen
            }),
            marginLeft: -drawerWidth
        },
        contentShift: {
            transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen
            }),
            marginLeft: 0
        }
    })
)

export default function DashboardPage(): React.ReactElement {
    const classes = useStyles()
    const [drawerOpen, setDrawerOpen] = useState(true)
    const [menuAnchorRef, setMenuAnchorRef] = useState(null)
    const theme = useTheme()
    const { path, url } = useRouteMatch()
    const history = useHistory()

    const token = useSelector<AppState, string|undefined>((data) => data.user.session?.token)
    if (!token) {
        return <Typography>Not authorized</Typography>
    }

    const handleDrawerOpen = () => {
        setDrawerOpen(true)
    }

    const handleDrawerClose = () => {
        setDrawerOpen(false)
    }

    const handleMenuOpen = (event: MouseEvent) => {
        setMenuAnchorRef(event.currentTarget as any)
    }

    const onLogout = () => {
        handleMenuClose()
        dispatch(loggedOut(null))
    }

    const handleMenuClose = () => {
        setMenuAnchorRef(null)
    }

    let treeNodeId = 1
    const nextNodeId = () => (treeNodeId++).toString()

    return (
        <div className={classes.root}>
            <CssBaseline />
            <AppBar
                className={clsx(classes.appBar, {
                    [classes.appBarShift]: drawerOpen
                })}
                position="fixed"
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        className={clsx(classes.menuButton, drawerOpen && classes.hide)}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        TradersClub
                    </Typography>
                    <div>
                        <IconButton
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            color="inherit"
                            onClick={handleMenuOpen}
                        >
                            <AccountCircle />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={menuAnchorRef}
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "right"
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "right"
                            }}
                            open={menuAnchorRef !== null}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={onLogout}>Logout</MenuItem>
                        </Menu>
                    </div>
                </Toolbar>
            </AppBar>
            <Drawer
                className={classes.drawer}
                variant="persistent"
                anchor="left"
                open={drawerOpen}
                classes={{
                    paper: classes.drawerPaper
                }}
            >
                <div className={classes.drawerHeader}>
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === "ltr" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                </div>

                <TreeView
                    className={classes.treeView}
                    defaultExpanded={["3"]}
                    defaultCollapseIcon={<ArrowDropDownIcon />}
                    defaultExpandIcon={<ArrowRightIcon />}
                    defaultEndIcon={<div style={{ width: 24 }} />}
                >
                    <StyledTreeItem
                        nodeId={nextNodeId()}
                        labelText="Watchlist"
                        onSelected={() => history.push(`${url}/watchlist`)}
                        labelIcon={ViewListIcon}
                        color="#1a73e8"
                        bgColor="#e8f0fe"
                    />
                    <StyledTreeItem
                        nodeId={nextNodeId()}
                        onSelected={() => history.push(`${url}/companies`)}
                        labelText="Companies"
                        labelIcon={MailIcon}
                        color="#e3742f"
                        bgColor="#fcefe3"
                    />
                    <StyledTreeItem
                        nodeId={nextNodeId()}
                        onSelected={() => history.push(`${url}/articles`)}
                        labelText="Articles"
                        labelIcon={NextWeekSharp}
                        color="#e3742f"
                        bgColor="#fcefe3"
                    />
                    <StyledTreeItem
                        nodeId={nextNodeId()}
                        onSelected={() => history.push(`${url}/discussions`)}
                        labelText="Discussions"
                        labelIcon={ForumIcon}
                        color="#e3742f"
                        bgColor="#fcefe3"
                    />
                    <Divider />
                    <StyledTreeItem
                        nodeId={nextNodeId()}
                        onSelected={() => history.push(`${url}/settings`)}
                        labelText="Settings"
                        labelIcon={AccountCircle}
                        color="#e3742f"
                        bgColor="#fcefe3"
                    />
                </TreeView>
            </Drawer>

            <main
                className={clsx(classes.content, {
                    [classes.contentShift]: drawerOpen
                })}
            >
                <div className={classes.drawerHeader} />
                <Switch>
                    <Route exact path={`${path}/companies`} component={CompaniesList} />
                    <Route exact path={`${path}/articles`} component={GlobalArticles} />
                    <Route exact path={`${path}/articles/:symbol`} component={CompanyArticles} />
                    <Route exact path={`${path}/financials/:symbol`} component={CompanyFinancials} />
                    <Route exact path={`${path}/discussions`} component={StockDiscussions} />
                    <Route exact path={`${path}/discussions/:symbol`} component={StockDiscussions} />
                    <Route exact path={`${path}/discussions/:symbol/thread/:threadId/reply/:replyId/edit`} component={EditDiscussionThreadReply} />
                    <Route exact path={`${path}/discussions/:symbol/thread/:threadId`} component={DiscussionThread} />
                    <Route exact path={`${path}/discussions/:symbol/new`} component={NewDiscussionThread} />
                    <Route exact path={`${path}/watchlist`} component={Watchlist} />
                    <Route exact path={`${path}/settings`} component={Settings} />
                    <Route exact path={`${path}/`} component={CompaniesList} />
                </Switch>
            </main>
        </div>
    )
}
