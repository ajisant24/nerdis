set_bpm(60)
set_reverb(7)

def ambient():
    pattern(["C3","G3","E3","D3"], 1)
    play_sample("angin")

forever(ambient)
