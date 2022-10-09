import { Box, ButtonGroup, Container, createTheme, CssBaseline, FormControlLabel, Grid, Link, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ThemeProvider, Tooltip, Typography } from '@mui/material';
import './App.css';
import { ChiiContainer } from './Components/ChiiContainer';
import Theme from './Theme';
import Sorters from './Sorters';
import { ChiiButton } from './Components/ChiiButton';
import { useEffect, useState } from 'react';
import { getUsers } from './Helpers';
import moment from 'moment/moment';
import InfoIcon from '@mui/icons-material/Info';

function App() {
  const [sorter, setSorter] = useState(Sorters[0].key);
  const [userList, setUserList] = useState([]);
  const [groningenOnly, setGroningenOnly] = useState(true);

  useEffect(() => {
    getUsers(sorter, groningenOnly).then(users => setUserList(users));
  }, [sorter, groningenOnly]);

  return (
    <ThemeProvider theme={createTheme(Theme)}>
      <CssBaseline />
      <Container sx={{ py: 5, minWidth: '100%' }}>
        <Grid>
          <ChiiContainer>
            <Box sx={{ m: 0, p: 0, width: '100%', borderRadius: '5px' }} component="img" src="Images/groningen.png"></Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={10.5}>
                <Grid sx={{ p: 1, borderRadius: '5px', backgroundColor: '#1b283877' }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Naam</TableCell>
                          <TableCell>PP</TableCell>
                          <TableCell>Playcount</TableCell>
                          <TableCell>Playtime</TableCell>
                          <TableCell>Accuracy</TableCell>
                          <TableCell>Ranked Score</TableCell>
                          <TableCell>Total Score</TableCell>
                          <TableCell>Clears</TableCell>
                          <TableCell>Total SS</TableCell>
                          <TableCell>Total S</TableCell>
                          <TableCell>Plaats</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {
                          userList.length > 0 ? userList.map((user, index) => (
                            <TableRow sx={{
                              backgroundColor: `${user.is_groningen ? 'inherit' : 'rgba(255,0,0,0.1)'}`,
                            }}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell><Tooltip title={user.note}><Link href={`https://osu.ppy.sh/users/${user.id}`} target='_blank'>{user.username}</Link></Tooltip></TableCell>
                              <TableCell>{user.pp.toLocaleString('en-US')}</TableCell>
                              <TableCell>{user.play_count.toLocaleString('en-US')}</TableCell>
                              <TableCell>{Math.round(moment.duration(user.play_time, 'seconds').asHours())} hours</TableCell>
                              <TableCell>{user.hit_accuracy.toFixed(1)}%</TableCell>
                              <TableCell>{user.ranked_score.toLocaleString('en-US')}</TableCell>
                              <TableCell>{user.total_score.toLocaleString('en-US')}</TableCell>
                              <TableCell>{(user.count_ss + user.count_ssh + user.count_s + user.count_sh + user.count_a).toLocaleString('en-US')}</TableCell>
                              <TableCell>{(user.count_ss + user.count_ssh).toLocaleString('en-US')}</TableCell>
                              <TableCell>{(user.count_s + user.count_sh).toLocaleString('en-US')}</TableCell>
                              <TableCell>{user.city}</TableCell>
                            </TableRow>
                          )) : <></>
                        }
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid sx={{ p: 1, mt: 1, borderRadius: '5px', backgroundColor: '#1b283877' }}>
                  <Typography variant="body2" align="center">
                    Als je nog niet in de lijst staat en erin wil, vraag mij via Discord: Amayakase#9198
                  </Typography>
                </Grid>
              </Grid>
              <Grid item xs={12} sm={1.5}>
                <Grid sx={{ p: 1, borderRadius: '5px', backgroundColor: '#1b283877' }}>
                  <Stack orientation="vertical" sx={{ width: '100%' }} spacing={1}>
                    {
                      Sorters.map((_sorter) => (
                        <ChiiButton onClick={() => setSorter(_sorter.key)} selected={_sorter.key === sorter} name={_sorter.title} color='#FF66AA' />
                      ))
                    }
                    <FormControlLabel control={<Switch onChange={event => setGroningenOnly(event.target.checked)} checked={groningenOnly} />} label="Alleen Groningen" />
                  </Stack>
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
