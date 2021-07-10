import React, {useState} from "react";
import {Stock} from "../../api/entities";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, Divider,
    Grid, Table, TableCell, TableRow,
    Typography
} from "@material-ui/core";
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider, KeyboardDatePicker} from "@material-ui/pickers";
import {fetchPredictedReturns, PredictedReturns} from "../../api/quotes";
import moment from "moment";

type Props = {
    stock: Stock|null;
    token: string|undefined;
    onClosed: () => void;
    open: boolean;
}

export default function PricePredictionDialog({stock, token, onClosed, open}: Props): React.ReactElement {
    const [results, setResults] = useState<PredictedReturns|null>(null);
    const [predictionDate, setPredictionDate] = useState<Date|null>(new Date());
    const [predictionFetching, setPredictionFetching] = useState<boolean>(false);

    const onCompute = () => {
        if (!stock || !token || !predictionDate) return;

        setPredictionFetching(true);

        fetchPredictedReturns({
            stock_symbol: stock.symbol,
            token,
            start_date: moment(predictionDate).subtract(4, "year").toDate(),
            prediction_date: predictionDate
        }).then((results) => {
            setPredictionFetching(false);
            setResults(results)
        });
    }

    return  <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <Dialog onClose={onClosed} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle
            id="customized-dialog-title">
            Predicted return calculator
        </DialogTitle>
        <DialogContent dividers>
            <Typography gutterBottom>
                Choose the date in future to perform predicted returns calculation
            </Typography>

            <Grid container direction={"column"}>
                <Grid item>
                    <KeyboardDatePicker
                        value={predictionDate}
                        id="date"
                        label="Date"
                        format="yyyy/MM/dd"
                        margin="normal"
                        disableToolbar
                        InputLabelProps={{
                            shrink: true,
                        }}
                        onChange={setPredictionDate}
                    />
                </Grid>

                <Grid item>
                    <Button disabled={predictionFetching} onClick={() => onCompute()}>Compute</Button>
                </Grid>
            </Grid>

            <Divider/>

            {predictionFetching && <Typography>Loading...</Typography>}

            {results &&
                <Table>
                    <TableRow>
                        <TableCell>Long ratio (%)</TableCell>
                        <TableCell>{results.long_ratio * 100}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Short ratio (%)</TableCell>
                        <TableCell>{results.short_ratio * 100}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Ratio (%)</TableCell>
                        <TableCell>{results.ratio * 100}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Predicted return ($)</TableCell>
                        <TableCell>{results.predicted_return}</TableCell>
                    </TableRow>
                </Table>
            }
        </DialogContent>
        <DialogActions>
            <Button autoFocus onClick={onClosed} color="primary">
                Close
            </Button>
        </DialogActions>
    </Dialog>
    </MuiPickersUtilsProvider>
}