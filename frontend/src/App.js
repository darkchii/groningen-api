import { Avatar, Box, ButtonGroup, Chip, CircularProgress, Container, createTheme, CssBaseline, FormControlLabel, Grid, Link, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider, Tooltip, Typography } from '@mui/material';
import './App.css';
import { ChiiContainer } from './Components/ChiiContainer';
import Theme from './Theme';
import Sorters from './Sorters';
import { ChiiButton } from './Components/ChiiButton';
import React, { useEffect, useState } from 'react';
import { getUsers } from './Helpers';
import moment from 'moment/moment';
import 'moment/locale/nl';
import InfoIcon from '@mui/icons-material/Info';
import { UserChip } from './Components/UserChip';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownwardRounded';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import WarningIcon from '@mui/icons-material/Warning';

moment.locale('nl');

function App() {
  const [sorter, setSorter] = useState(Sorters[0].key);
  const [userList, setUserList] = useState([]);
  const [groningenOnly, setGroningenOnly] = useState(true);
  const [showRestricted, setShowRestricted] = useState(false);
  const [columns, setColumns] = useState([
    { active: true, reverse: false, id: 'pp', label: 'PP', align: 'right', width: 170, formatter: (user, value) => !user.approx_pp ? `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}pp` : <Tooltip title='Gebruiker is inactief. Dit getal is gebaseerd op de top 1000 scores van deze speler en kan onnauwkeurig zijn.'><Grid sx={{ opacity: 0.7 }}>~{user.pp.toLocaleString('en-US', { maximumFractionDigits: 0 })}pp</Grid></Tooltip> },
    { active: true, reverse: false, id: 'play_count', label: 'Playcount', align: 'right', width: 170, formatter: (user, value) => value.toLocaleString('en-US') },
    { active: true, reverse: false, id: 'play_time', label: 'Playtime', align: 'right', width: 170, formatter: (user, value) => `${Math.round(moment.duration(value, 'seconds').asHours())} hours` },
    { active: true, reverse: false, id: 'hit_accuracy', label: 'Accuracy', align: 'right', width: 170, formatter: (user, value) => `${value.toFixed(2)}%` },
    { active: true, reverse: false, id: 'ranked_score', label: 'R. Score', align: 'right', width: 170, formatter: (user, value) => value.toLocaleString('en-US') },
    { active: true, reverse: false, id: 'total_score', label: 'T. Score', align: 'right', width: 170, formatter: (user, value) => value.toLocaleString('en-US') },
    { active: true, reverse: false, id: 'clears', label: 'Clears', align: 'right', width: 170, formatter: (user, value) => value.toLocaleString('en-US') },
    { active: true, reverse: false, id: 'total_ss', label: 'SS', align: 'right', width: 170, formatter: (user, value) => value.toLocaleString('en-US') },
    { active: true, reverse: false, id: 'total_s', label: 'S', align: 'right', width: 170, formatter: (user, value) => value.toLocaleString('en-US') },
    { active: true, reverse: false, id: 'count_a', label: 'A', align: 'right', width: 170, formatter: (user, value) => value.toLocaleString('en-US') },
    { active: true, reverse: false, id: 'city', label: 'Plaats', align: 'right', width: 170, formatter: (user, value) => value },
  ]);
  const [updateTable, triggerTableUpdate] = useState(false);
  const [updateUsers, triggerUsersUpdate] = useState(false);

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  useEffect(() => {
    columns.forEach((column, index) => {
      const persistActive = localStorage.getItem(`column_${column.id}_active`);
      if (persistActive) {
        column.active = JSON.parse(persistActive);
      }

      const persistReverse = localStorage.getItem(`column_${column.id}_reverse`);
      if (persistReverse) {
        column.reverse = JSON.parse(persistReverse);
      }
    });

    const persistCurrentSorter = localStorage.getItem('current_sorter');
    if (persistCurrentSorter) {
      if (columns.find(s => s.id === persistCurrentSorter)) {
        setSorter(persistCurrentSorter);
      }
    }

    triggerTableUpdate(true);
    triggerUsersUpdate(true);
  }, []);

  const updateUsersFunc = () => {
    getUsers(sorter, groningenOnly, showRestricted).then(users => {
      let reverse = false;
      columns.forEach(column => {
        if (column.id === sorter) {
          reverse = column.reverse;
        }
      });
      if (reverse) {
        users.reverse();
      }
      setUserList(users);
    });
    localStorage.setItem(`groningen_only`, groningenOnly);
    localStorage.setItem(`show_restricted`, showRestricted);
  };

  // useEffect(() => {
  //   updateUsersFunc();
  //   console.log('this got called on start');
  // }, [sorter, groningenOnly]);

  useEffect(() => {
    if (updateUsers) {
      updateUsersFunc();
      triggerUsersUpdate(false);
    }
  }, [updateUsers]);

  const handleSorterChange = (_sorter) => {
    if (sorter === _sorter.id) {
      columns.forEach(column => {
        if (column.id === _sorter.id) {
          column.reverse = !column.reverse;
          localStorage.setItem(`column_${column.id}_reverse`, JSON.stringify(column.reverse));
        }
      });
      triggerUsersUpdate(true);
      triggerTableUpdate(false);
    } else {
      setSorter(_sorter.id);
      triggerUsersUpdate(true);
      localStorage.setItem(`current_sorter`, _sorter.id);
    }
  }

  useEffect(() => {
    if (updateTable) {
      setColumns(columns);
      triggerTableUpdate(false);
    }
  }, [updateTable]);

  return (
    <ThemeProvider theme={createTheme(Theme)}>
      <CssBaseline />
      <Container sx={{ py: 5, minWidth: '100%' }}>
        <Grid>
          <ChiiContainer>
            <Box sx={{ m: 0, p: 0, width: '100%', borderRadius: '5px' }} component="img" src="Images/groningen.png"></Box>
            <Grid>
              <Grid sx={{ p: 1, mt: 1, borderRadius: '5px', backgroundColor: '#1b283877' }}>
                <Grid container>
                  <Grid item xs={12} md={10}>
                    <Typography variant="body2" align="center">Dit zijn de leaderboards voor de provincie Groningen!</Typography>
                    <Typography variant="body2" align="center">Als je nog niet in de lijst staat en erin wil, vraag mij via Discord: Amayakase#9198</Typography>
                    <Grid align="center">
                      {
                        columns.map((column) => (
                          <FormControlLabel control={<Switch size='small' onChange={event => {
                            column.active = event.target.checked;
                            localStorage.setItem(`column_${column.id}_active`, JSON.stringify(column.active));
                            triggerTableUpdate(true);
                          }} checked={column.active} />} label={column.label} />
                        ))
                      }
                    </Grid>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControlLabel control={<Switch onChange={event => { setGroningenOnly(event.target.checked); triggerUsersUpdate(true); }} defaultChecked={groningenOnly} />} label="Alleen Groningen" />
                    <FormControlLabel control={<Switch onChange={event => { setShowRestricted(event.target.checked); triggerUsersUpdate(true); }} defaultChecked={showRestricted} />} label="Toon restricted" />
                    {/* <FormControlLabel control={<Switch onChange={event => setReverseState(event.target.checked)} checked={reverseResult} />} label="Omgekeerde volgorde" /> */}
                  </Grid>
                </Grid>
              </Grid>
              <Grid sx={{ p: 1, mt: 1, borderRadius: '5px', backgroundColor: '#1b283877' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell maxWidth={0.1}>#</TableCell>
                        <TableCell maxWidth={0.2}>Naam</TableCell>
                        {
                          columns.map((column) => (
                            column.active && (
                              <TableCell align={column.align} maxWidth={column.width}>
                                <Link onClick={() => handleSorterChange(column)}>
                                  <Chip size='small' icon={column.reverse ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />} sx={{
                                    bgcolor: column.id === sorter ? '#FF66AA33' : '#ffffff33', '&:hover': {
                                      boxShadow: `0 0 10px 0 #ffffffff`,
                                    }
                                  }} label={column.label} />
                                </Link>
                                {/* <ChiiButton size='small' onClick={() => setSorter(column.id)} selected={column.id === sorter} name={column.label} color='#FF66AA' /> */}
                              </TableCell>
                            )
                          ))
                        }
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        userList.length > 0 ? userList.map((user, index) => (
                          <TableRow sx={{ backgroundColor: `${user.is_groningen ? 'inherit' : 'rgba(255,0,0,0.1)'}` }}>
                            <TableCell maxWidth={0.1}>{index + 1}</TableCell>
                            <TableCell maxWidth={0.2}><UserChip user={user} /> {user.is_restricted ? <Tooltip title={`Deze gebruiker is restricted op Bancho!`}><Chip color='error' variant="outlined" size='small' label={<WarningIcon sx={{pt:0.5}} />} /></Tooltip> : ''}</TableCell>
                            {
                              columns.map((column) => (
                                column.active && (
                                  <TableCell align={column.align} maxWidth={column.width}>{column.formatter(user, user[column.id])}</TableCell>
                                )
                              ))
                            }
                          </TableRow>
                        )) : <></>
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid sx={{ p: 1, mt: 1, borderRadius: '5px', backgroundColor: '#1b283877' }}>
                <Grid container>
                  <Typography variant="body2" align="center">Website gemaakt door Amayakase &bull; <Link href="https://twitter.com/id2amayakase">Twitter</Link> &bull; <Link href="https://github.com/darkchii/groningen-api">GitHub</Link></Typography>
                </Grid>
              </Grid>
            </Grid>
          </ChiiContainer>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;
